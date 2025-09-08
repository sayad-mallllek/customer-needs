import { createRoute, Link } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, Card, Input, Select } from "../components/ui";
import { useToast } from "../components/toast";
import { TRANSACTION_TYPES, PAYMENT_METHODS } from "../lib/utils";
import { useForm } from "react-hook-form";
import { Modal } from "../components/modal";
import { transactionEditSchema } from "../lib/validation";
import type { TransactionEditInput } from "../lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "transactions",
  component: TransactionsPage,
});

interface TxForm {
  customer_id: string;
  title: string;
  description?: string;
  type: string;
  amount: string;
  payment_method?: string;
}

function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ type: "", method: "", search: "" });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<any | null>(null);
  const { register, handleSubmit, reset } = useForm<TxForm>();
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<TransactionEditInput>({
    resolver: zodResolver(transactionEditSchema) as any,
  });

  const { push } = useToast();
  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from("transactions")
      .select("*, customer:customers(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.method) query = query.eq("payment_method", filters.method);
    if (filters.search) query = query.ilike("title", `%${filters.search}%`);
    const { data, error, count } = await query;
    if (!error) {
      setTransactions(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id,name")
      .order("name");
    setCustomers(data || []);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);
  useEffect(() => {
    fetchTransactions(); /* eslint-disable-next-line */
  }, [filters, page]);
  useEffect(() => {
    const channel = supabase
      .channel("realtime-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchTransactions()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters, page]);

  const onSubmit = async (form: TxForm) => {
    const amt = Number(form.amount);
    if (!form.customer_id || !form.title || !form.type || !(amt > 0)) return;
    const payload = { ...form, amount: amt } as any;
    const { error } = await supabase.from("transactions").insert(payload);
    if (!error) {
      reset();
      setShowForm(false);
      fetchTransactions();
      push({ title: "Transaction added", variant: "success" });
    } else
      push({ title: "Error", description: error.message, variant: "error" });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search"
            value={filters.search}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, search: e.target.value }));
            }}
            className="w-40"
          />
          <Select
            value={filters.type}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, type: e.target.value }));
            }}
            className="w-40"
          >
            <option value="">Type</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            value={filters.method}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, method: e.target.value }));
            }}
            className="w-32"
          >
            <option value="">Method</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Add"}
          </Button>
        </div>
      </div>
      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-3 md:grid-cols-6"
          >
            <div className="md:col-span-2">
              <Select {...register("customer_id")} defaultValue="">
                <option value="" disabled>
                  Customer
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Input placeholder="Title" {...register("title")} />
            </div>
            <div>
              <Select {...register("type")} defaultValue="">
                <option value="" disabled>
                  Type
                </option>
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                {...register("amount")}
              />
            </div>
            <div className="md:col-span-3">
              <Input placeholder="Description" {...register("description")} />
            </div>
            <div>
              <Select {...register("payment_method")} defaultValue="">
                <option value="">Method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-1 flex items-start">
              <Button className="w-full">Save</Button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-neutral-500">No transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-b-0 hover:bg-neutral-50"
                  >
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        to="/transactions/$transactionId"
                        params={{ transactionId: t.id }}
                        className="text-brand hover:underline"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: t.customer_id }}
                        className="text-brand hover:underline"
                      >
                        {t.customer?.name || "—"}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-xs">{t.type}</td>
                    <td className="py-2 pr-4">{Number(t.amount).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-xs">
                      {t.payment_method || "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-neutral-500 flex items-center gap-2">
                      {new Date(t.created_at).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setEditing(t);
                          resetEdit({
                            title: t.title,
                            amount: Number(t.amount),
                          });
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete transaction?")) return;
                          const { error } = await supabase
                            .from("transactions")
                            .delete()
                            .eq("id", t.id);
                          if (error)
                            push({
                              title: "Delete failed",
                              description: error.message,
                              variant: "error",
                            });
                          else {
                            push({
                              title: "Transaction deleted",
                              variant: "success",
                            });
                            fetchTransactions();
                          }
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 text-xs text-neutral-600">
          <span>
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-outline px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Transaction"
        size="sm"
        footer={
          <>
            <Button form="editTxForm" loading={editSubmitting}>
              Save
            </Button>
            <Button
              type="button"
              className="btn btn-outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          </>
        }
      >
        <form
          id="editTxForm"
          onSubmit={handleEditSubmit(async (data) => {
            if (!editing) return;
            const { error } = await supabase
              .from("transactions")
              .update({ title: data.title, amount: data.amount })
              .eq("id", editing.id);
            if (error)
              push({
                title: "Update failed",
                description: error.message,
                variant: "error",
              });
            else {
              push({ title: "Transaction updated", variant: "success" });
              fetchTransactions();
              setEditing(null);
            }
          })}
          className="space-y-3"
        >
          <div>
            <Input placeholder="Title" {...editRegister("title")} />
            {editErrors?.title && (
              <p className="text-xs text-red-600 mt-1">
                {String(editErrors.title.message)}
              </p>
            )}
          </div>
          <div>
            <Input
              type="number"
              step="0.01"
              placeholder="Amount"
              {...editRegister("amount", { valueAsNumber: true })}
            />
            {editErrors?.amount && (
              <p className="text-xs text-red-600 mt-1">
                {String(editErrors.amount.message)}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
