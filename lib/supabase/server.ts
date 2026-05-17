import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Cookie-based server client — forwards the logged-in user's session to Supabase.
// Use in Server Components, Route Handlers, and Server Actions.
// IMPORTANT: This is async — call with `await createServerClient()`.
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies.
            // Route Handlers / Server Actions can write — silence the error here.
          }
        },
      },
    }
  );
}
