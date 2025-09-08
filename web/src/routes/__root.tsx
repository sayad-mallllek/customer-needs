import {
  Outlet,
  createRootRouteWithContext,
  Link,
  useRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface RouterContext {
  // user session placeholder
  session: any;
  sessionReady: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    const pathIsAuth = /\/(login|signup)$/.test(location.pathname);
    if (context.sessionReady && !context.session && !pathIsAuth) {
      throw redirect({ to: "/login" });
    }
  },
  component: RootLayout,
});

function RootLayout() {
  const router = useRouter();
  const session = router.options.context.session;
  const authed = !!session;

  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as any) || "light"
  );
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      {authed && (
        <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-4">
            <Link to="/" className="font-semibold text-brand">
              CustomerNeeds
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link to="/customers" className="hover:underline">
                Customers
              </Link>
              <Link to="/transactions" className="hover:underline">
                Transactions
              </Link>
              <Link to="/payments" className="hover:underline">
                Payments
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() =>
                  setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
                className="btn btn-outline px-2 py-1 text-xs"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <span className="text-xs text-neutral-600 hidden sm:inline">
                {session?.user?.email}
              </span>
              <button
                onClick={() =>
                  supabase.auth
                    .signOut()
                    .then(() => (window.location.href = "/login"))
                }
                className="btn btn-outline px-2 py-1 text-xs"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-neutral-500 py-4">
        © {new Date().getFullYear()} CustomerNeeds
      </footer>
    </div>
  );
}
