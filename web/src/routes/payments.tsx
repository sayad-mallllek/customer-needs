import { createRoute } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Card, Input, Select, Button } from "../components/ui";
import { useToast } from "../components/toast";
import { Modal } from "../components/modal";
import { paymentEditSchema } from "../lib/validation";
import type { PaymentEditInput } from "../lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "payments",
  component: PaymentsPage,
});

interface Payment {
  id: string;
  amount: number;
  created_at: string;
  method: string;
  transaction_id: string;
  transaction?: any;
}

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [form, setForm] = useState({
    transaction_id: "",
    amount: "",
    method: "",
    note: "",
  });
  const [editing, setEditing] = useState<any | null>(null);
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<PaymentEditInput>({
    resolver: zodResolver(paymentEditSchema) as any,
  });

  const { push } = useToast();
  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("payments")
      .select("*, transaction:transactions(title,customer_id)")
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (search) query = query.ilike("note", `%${search}%`);
    const { data, error, count } = await query; // count included from initial select options
    if (!error) {
      setPayments((data as any) || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };
  const loadTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id,title")
      .order("created_at", { ascending: false })
      .limit(100);
    setTransactions(data || []);
  };
  useEffect(() => {
    loadTransactions();
  }, []);
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page, search]);
  useEffect(() => {
    const channel = supabase
      .channel("realtime-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.transaction_id || !(amt > 0) || !form.method) return;
    const { error } = await supabase
      .from("payments")
      .insert({
        transaction_id: form.transaction_id,
        amount: amt,
        method: form.method,
        note: form.note,
      });
    if (!error) {
      setForm({ transaction_id: "", amount: "", method: "", note: "" });
      load();
      push({ title: "Payment added", variant: "success" });
    } else
      push({ title: "Error", description: error.message, variant: "error" });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Payments</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search note"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-48"
          />
        </div>
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <Select
              value={form.transaction_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, transaction_id: e.target.value }))
              }
            >
              <option value="">Transaction</option>
              {transactions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </div>
          <Input
            placeholder="Amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Select
            value={form.method}
            onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
          >
            <option value="">Method</option>
            <option value="cash">cash</option>
            <option value="whish">whish</option>
          </Select>
          <Input
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="flex items-start">
            <Button className="w-full">Add</Button>
          </div>
        </form>
      </Card>
      <Card>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-neutral-500">No payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-2 pr-4">Transaction</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">
                      {p.transaction?.title || p.transaction_id}
                    </td>
                    <td className="py-2 pr-4">{Number(p.amount).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-xs">{p.method}</td>
                    <td className="py-2 pr-4 text-xs text-neutral-500 flex items-center gap-2">
                      {new Date(p.created_at).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setEditing(p);
                          resetEdit({ amount: Number(p.amount) });
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete payment?")) return;
                          const { error } = await supabase
                            .from("payments")
                            .delete()
                            .eq("id", p.id);
                          if (error)
                            push({
                              title: "Delete failed",
                              description: error.message,
                              variant: "error",
                            });
                          else {
                            push({
                              title: "Payment deleted",
                              variant: "success",
                            });
                            load();
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
        title="Edit Payment"
        size="sm"
        footer={
          <>
            <Button form="editPaymentForm" loading={editSubmitting}>
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
          id="editPaymentForm"
          onSubmit={handleEditSubmit(async (data) => {
            if (!editing) return;
            const { error } = await supabase
              .from("payments")
              .update({ amount: data.amount })
              .eq("id", editing.id);
            if (error)
              push({
                title: "Update failed",
                description: error.message,
                variant: "error",
              });
            else {
              push({ title: "Payment updated", variant: "success" });
              load();
              setEditing(null);
            }
          })}
          className="space-y-3"
        >
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
