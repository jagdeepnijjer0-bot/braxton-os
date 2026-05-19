"use client";

import { usePathname } from "next/navigation";
import NotificationBell from "./notifications/NotificationBell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/":             { title: "Dashboard",    subtitle: "Welcome back" },
  "/crm":          { title: "CRM",          subtitle: "Manage your contacts and relationships" },
  "/deal-tracker": { title: "Deal Tracker", subtitle: "Track your pipeline and close deals" },
  "/projects":     { title: "Projects",     subtitle: "Manage your refurb projects" },
  "/finance":      { title: "Finance",      subtitle: "Income, expenses and financial overview" },
  "/inbox":        { title: "Inbox",        subtitle: "Unified conversations across all channels" },
  "/tasks":        { title: "Tasks",        subtitle: "Your operational task list" },
  "/calendar":     { title: "Calendar",     subtitle: "Events, meetings and deadlines" },
  "/outreach":     { title: "Outreach",     subtitle: "Manage campaigns and sequences" },
  "/submissions":  { title: "Submissions",  subtitle: "Inbound form submissions" },
  "/settings":     { title: "Settings",     subtitle: "Configure your workspace" },
};

interface Props {
  onMenuOpen: () => void;
}

export default function TopBar({ onMenuOpen }: Props) {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const page = pageTitles[pathname] ?? pageTitles[base] ?? { title: "Braxton OS", subtitle: "" };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
      {/* Hamburger — only shown on mobile */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight truncate">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block truncate">
            {page.subtitle}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Global search — hidden on smallest screens */}
        <div className="relative hidden sm:block">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-300 transition-all w-40 lg:w-48"
          />
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
