import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role client — bypasses RLS. Only use in trusted server code (API routes, server actions).
// Never import this in client components or expose the key to the browser.
let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add both to your .env.local file."
    );
  }

  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}
