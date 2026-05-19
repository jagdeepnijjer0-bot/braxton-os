"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, memo } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export type ShellProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
} | null;

const AUTH_PATHS = ["/login", "/signup", "/forms/"];

interface Props {
  children: React.ReactNode;
  profile:  ShellProfile;
}

// Memo-wrap so Sidebar/TopBar don't re-render when AppShell's sidebarOpen state changes
const MemoSidebar = memo(Sidebar);
const MemoTopBar  = memo(TopBar);

export default function AppShell({ children, profile }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile navigation)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  // Stable callbacks so memoised children don't re-render on every AppShell render
  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Auth pages render without chrome
  if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Sidebar — fixed on desktop, slide-in on mobile */}
      <MemoSidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      {/* Main content — no left margin on mobile, 240px on desktop */}
      <div className="flex-1 min-w-0 lg:ml-[240px]">
        <MemoTopBar onMenuOpen={openSidebar} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </>
  );
}
