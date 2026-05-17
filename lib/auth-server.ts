import "server-only";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RoleLevel = "viewer" | "member" | "admin";

const ROLE_ORDER: Record<RoleLevel, number> = { viewer: 0, member: 1, admin: 2 };

// Returns the currently authenticated user, or null.
export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

// Returns the profile row for the current user, or null.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}

// Redirects to /login if unauthenticated. Returns user.
export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

// Redirects to / if user doesn't have the minimum role level.
export async function requireRole(minRole: RoleLevel): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (ROLE_ORDER[profile.role as RoleLevel] < ROLE_ORDER[minRole]) redirect("/");
  return profile;
}
