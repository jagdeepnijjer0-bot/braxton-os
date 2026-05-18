"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

// Inline type — no dependency on lib/supabase/* from this client component.
export type ShellProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
} | null;

// Pages that should render without the sidebar/topbar shell
const AUTH_PATHS = ["/login", "/signup", "/forms/"];

interface Props {
  children: React.ReactNode;
  profile: ShellProfile;
}

export default function AppShell({ children, profile }: Props) {
  const pathname = usePathname();

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
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
