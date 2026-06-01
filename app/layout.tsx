import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell, { type ShellProfile } from "./components/AppShell";
import { ToastProvider } from "./components/ui/Toast";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Braxton OS",
  description: "Business operating system for modern teams",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
    // Supabase not configured yet — silently continue
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">
        <ToastProvider>
          <AppShell profile={profile}>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
