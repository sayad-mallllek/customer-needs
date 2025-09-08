import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
// Auto-generated route tree by TanStack Router's file-based routing (manual placeholder)
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  context: { session: null, sessionReady: false },
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      router.update({ context: { session: data.session, sessionReady: true } });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  router.update({ context: { session, sessionReady: !loading } });

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-neutral-500">
        Loading...
      </div>
    );
  return <RouterProvider router={router} />;
}
