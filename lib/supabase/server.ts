import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Use this in Server Components, Route Handlers, and Server Actions.
// Creates a fresh client per request (no singleton — safe for server context).
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
