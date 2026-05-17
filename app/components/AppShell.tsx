"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

interface Props {
  children: React.ReactNode;
  profile: Profile;
}

// Wraps all pages. On /login, renders children only (no shell).
// On all other routes, renders Sidebar + TopBar + main content.
export default function AppShell({ children, profile }: Props) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar profile={profile} />
      <div className="flex-1" style={{ marginLeft: "240px" }}>
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </>
  );
}
