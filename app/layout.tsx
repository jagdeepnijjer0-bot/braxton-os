import type { Metadata } from "next";
import "./globals.css";
import AppShell, { type ShellProfile } from "./components/AppShell";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Braxton OS",
  description: "Business operating system for modern teams",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Fetch the logged-in user's profile to pass to the Sidebar.
  // Returns null on the /login page (unauthenticated) — AppShell hides the sidebar then.
  let profile: ShellProfile = null;
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", user.id)
        .single();
      profile = data ?? null;
    }
  } catch {
    // If Supabase isn't configured yet, silently continue
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">
        <AppShell profile={profile}>{children}</AppShell>
      </body>
    </html>
  );
}
