import { createRoute } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: HomePage,
});

function HomePage() {
  const [customersCount, setCustomersCount] = useState<number | null>(null);
  const [receive, setReceive] = useState<number | null>(null);
  const [owe, setOwe] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { count: cCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      const { data: balances } = await supabase
        .from("customer_balances")
        .select("outstanding");
      let r = 0,
        o = 0;
      balances?.forEach((b) => {
        if (b.outstanding > 0) r += Number(b.outstanding);
        else if (b.outstanding < 0) o += Number(b.outstanding);
      });
      setCustomersCount(cCount || 0);
      setReceive(r);
      setOwe(o);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-sm text-neutral-500">Total Customers</p>
          <p className="text-2xl font-bold">{loading ? "…" : customersCount}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-sm text-neutral-500">Outstanding (Receive)</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? "…" : (receive ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="card-surface p-4">
          <p className="text-sm text-neutral-500">Outstanding (You Owe)</p>
          <p className="text-2xl font-bold text-red-600">
            {loading ? "…" : Math.abs(owe ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
