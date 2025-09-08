import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

console.log(import.meta.env);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     persistSession: true,
//     storageKey: "cn_supabase_auth",
//   },
// });
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "cn_supabase_auth",
  },
});
