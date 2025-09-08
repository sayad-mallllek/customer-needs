import { createRoute, Link, useParams } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, Card, Input } from "../components/ui";
import { Modal } from "../components/modal";
import { customerEditSchema } from "../lib/validation";
import type { CustomerEditInput } from "../lib/validation";
import { useToast } from "../components/toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "customers",
  component: CustomersPage,
});

export const CustomerDetailRoute = createRoute({
  getParentRoute: () => Route,
  path: "$customerId",
  component: CustomerDetailPage,
});

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5).optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<CustomerEditInput>({ resolver: zodResolver(customerEditSchema) });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<null | Customer>(null);

  const { push } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error, count } = await query;
    if (!error && data) {
      setCustomers(data as Customer[]);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers(); /* eslint-disable-next-line */
  }, [page, search]);
  // realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("realtime-customers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onSubmit = async (form: CustomerForm) => {
    setAdding(true);
    const { error } = await supabase.from("customers").insert(form);
    setAdding(false);
    if (!error) {
      reset();
      setShowForm(false);
      fetchCustomers();
      push({ title: "Customer added", variant: "success" });
    } else
      push({ title: "Error", description: error.message, variant: "error" });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="sm:w-48"
          />
          <Button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="whitespace-nowrap"
          >
            {showForm ? "Close" : "Add Customer"}
          </Button>
        </div>
      </div>
      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-3 sm:grid-cols-3"
          >
            <div className="sm:col-span-1">
              <Input placeholder="Name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-1">
              <Input placeholder="Phone" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:col-span-1">
              <Button loading={adding} className="w-full sm:w-auto">
                Save
              </Button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-neutral-500">No customers.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-b-0 hover:bg-neutral-50"
                  >
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: c.id }}
                        className="text-brand hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{c.phone || "-"}</td>
                    <td className="py-2 pr-4 text-xs text-neutral-500 flex items-center gap-2">
                      {new Date(c.created_at).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setEditing(c);
                          resetEdit({ name: c.name, phone: c.phone || "" });
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete customer?")) return;
                          const { error } = await supabase
                            .from("customers")
                            .delete()
                            .eq("id", c.id);
                          if (error)
                            push({
                              title: "Delete failed",
                              description: error.message,
                              variant: "error",
                            });
                          else {
                            push({
                              title: "Customer deleted",
                              variant: "success",
                            });
                            fetchCustomers();
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
        title="Edit Customer"
        size="sm"
        footer={
          <>
            <Button form="editCustomerForm" loading={editSubmitting}>
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
          id="editCustomerForm"
          onSubmit={handleEditSubmit(async (data) => {
            if (!editing) return;
            const parsed = data; // already validated
            const { error } = await supabase
              .from("customers")
              .update({ name: parsed.name, phone: parsed.phone || null })
              .eq("id", editing.id);
            if (error)
              push({
                title: "Update failed",
                description: error.message,
                variant: "error",
              });
            else {
              push({ title: "Customer updated", variant: "success" });
              fetchCustomers();
              setEditing(null);
            }
          })}
          className="space-y-3"
        >
          <div>
            <Input placeholder="Name" {...editRegister("name")} />
            {editErrors.name && (
              <p className="text-xs text-red-600 mt-1">
                {editErrors.name.message}
              </p>
            )}
          </div>
          <div>
            <Input placeholder="Phone" {...editRegister("phone")} />
            {editErrors.phone && (
              <p className="text-xs text-red-600 mt-1">
                {editErrors.phone.message}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CustomerDetailPage() {
  const { customerId } = useParams({ from: CustomerDetailRoute.id });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: c } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();
    const { data: tx } = await supabase
      .from("transactions")
      .select("*, payments:payments(amount)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    const { data: bal } = await supabase
      .from("customer_balances")
      .select("outstanding")
      .eq("customer_id", customerId)
      .single();
    setCustomer((c as any) || null);
    setTransactions(tx || []);
    setBalance(bal?.outstanding ?? 0);
    setLoading(false);
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [customerId]);

  if (loading) return <p className="text-sm text-neutral-500">Loading...</p>;
  if (!customer)
    return <p className="text-sm text-neutral-500">Customer not found.</p>;

  const receive = balance && balance > 0 ? balance : 0;
  const owe = balance && balance < 0 ? Math.abs(balance) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{customer.name}</h1>
        <Link to="/customers" className="text-sm text-brand hover:underline">
          Back
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs text-neutral-500">Phone</p>
          <p className="font-medium">{customer.phone || "-"}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Should Receive</p>
          <p className="font-semibold text-green-600">{receive.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">You Owe</p>
          <p className="font-semibold text-red-600">{owe.toFixed(2)}</p>
        </Card>
      </div>
      <Card>
        <h2 className="font-medium mb-3">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-500">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const paid =
                    t.payments?.reduce(
                      (sum: number, p: any) => sum + Number(p.amount),
                      0
                    ) || 0;
                  const remaining = Number(t.amount) - paid;
                  return (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium">{t.title}</td>
                      <td className="py-2 pr-4 text-xs">{t.type}</td>
                      <td className="py-2 pr-4">
                        {Number(t.amount).toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-green-600">
                        {paid.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 pr-4 ${
                          remaining > 0 ? "text-red-600" : ""
                        }`}
                      >
                        {remaining.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
