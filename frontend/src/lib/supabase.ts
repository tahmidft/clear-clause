import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("ClearClause: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.");
}

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Post-confirmation redirect target; must be allowed in Supabase URL configuration. */
export function authRedirectUrl(path = "/login"): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${path}`;
}
