import { createRoute, Link, useParams } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Card, Input, Select, Button } from "../components/ui";
import { useToast } from "../components/toast";
import { PAYMENT_METHODS } from "../lib/utils";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "transactions/$transactionId",
  component: TransactionDetailPage,
});

interface Payment {
  id: string;
  amount: number;
  created_at: string;
  method: string;
  note?: string;
}

function TransactionDetailPage() {
  const { transactionId } = useParams({ from: Route.id });
  const [tx, setTx] = useState<any | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", method: "", note: "" });
  const [adding, setAdding] = useState(false);

  const { push } = useToast();
  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from("transactions")
      .select("*, customer:customers(name)")
      .eq("id", transactionId)
      .single();
    const { data: pay } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false });
    setTx(t);
    setPayments(pay || []);
    setLoading(false);
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [transactionId]);
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-tx-${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = tx ? Number(tx.amount) - totalPaid : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!(amt > 0) || !form.method) return;
    setAdding(true);
    const { error } = await supabase
      .from("payments")
      .insert({
        transaction_id: transactionId,
        amount: amt,
        method: form.method,
        note: form.note,
      });
    setAdding(false);
    if (!error) {
      setForm({ amount: "", method: "", note: "" });
      load();
      push({ title: "Payment added", variant: "success" });
    } else
      push({ title: "Error", description: error.message, variant: "error" });
  };

  if (loading) return <p className="text-sm text-neutral-500">Loading...</p>;
  if (!tx) return <p className="text-sm text-neutral-500">Not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tx.title}</h1>
        <Link to="/transactions" className="text-sm text-brand hover:underline">
          Back
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs text-neutral-500">Customer</p>
          <p className="font-medium">{tx.customer?.name || "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Type</p>
          <p className="font-medium text-xs">{tx.type}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Amount</p>
          <p className="font-semibold">{Number(tx.amount).toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">Remaining</p>
          <p
            className={`font-semibold ${
              remaining > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {remaining.toFixed(2)}
          </p>
        </Card>
      </div>
      <Card>
        <h2 className="font-medium mb-3">Add Payment</h2>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-5">
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
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="md:col-span-2"
          />
          <div className="flex items-start">
            <Button loading={adding} className="w-full">
              Save
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="font-medium mb-3">Payments ({payments.length})</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-neutral-500">No payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Note</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">{Number(p.amount).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-xs">{p.method}</td>
                    <td className="py-2 pr-4 text-xs">{p.note || "—"}</td>
                    <td className="py-2 pr-4 text-xs text-neutral-500 flex items-center gap-2">
                      {new Date(p.created_at).toLocaleDateString()}
                      <button
                        onClick={async () => {
                          const amountStr = prompt("Amount", String(p.amount));
                          if (amountStr === null) return;
                          const amount = Number(amountStr) || 0;
                          const { error } = await supabase
                            .from("payments")
                            .update({ amount })
                            .eq("id", p.id);
                          if (error)
                            push({
                              title: "Update failed",
                              description: error.message,
                              variant: "error",
                            });
                          else {
                            push({
                              title: "Payment updated",
                              variant: "success",
                            });
                            load();
                          }
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
      </Card>
    </div>
  );
}
