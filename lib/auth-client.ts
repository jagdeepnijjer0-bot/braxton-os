// Browser-safe auth helpers — safe to import in "use client" components.
// Never import lib/supabase/server or next/headers here.
import { supabase } from "@/lib/supabase/client";

export async function getClientUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
