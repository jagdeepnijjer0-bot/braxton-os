"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

// Pages that should render without the sidebar/topbar shell
const AUTH_PATHS = ["/login", "/signup"];

interface Props {
  children: React.ReactNode;
  profile: Profile;
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
