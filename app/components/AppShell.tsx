"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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

  // Auth pages render without chrome
  if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Sidebar — fixed on desktop, slide-in on mobile */}
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main content — no left margin on mobile, 240px on desktop */}
      <div className="flex-1 min-w-0 lg:ml-[240px]">
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </>
  );
}
