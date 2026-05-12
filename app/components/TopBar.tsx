"use client";

import { usePathname } from "next/navigation";
import NotificationBell from "./notifications/NotificationBell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/":             { title: "Dashboard",    subtitle: "Welcome back, John" },
  "/crm":          { title: "CRM",          subtitle: "Manage your contacts and relationships" },
  "/deal-tracker": { title: "Deal Tracker", subtitle: "Track your pipeline and close deals" },
  "/projects":     { title: "Projects",     subtitle: "Manage your refurb projects" },
  "/finance":      { title: "Finance",      subtitle: "Income, expenses and financial overview" },
  "/inbox":        { title: "Inbox",        subtitle: "Unified conversations across all channels" },
  "/tasks":        { title: "Tasks",        subtitle: "Your operational task list" },
  "/calendar":     { title: "Calendar",     subtitle: "Events, meetings and deadlines" },
  "/outreach":     { title: "Outreach",     subtitle: "Manage campaigns and sequences" },
  "/settings":     { title: "Settings",     subtitle: "Configure your workspace" },
};

export default function TopBar() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const page = pageTitles[pathname] ?? pageTitles[base] ?? { title: "Braxton OS", subtitle: "" };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{page.title}</h1>
        {page.subtitle && (
          <p className="text-sm text-gray-500">{page.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-300 transition-all w-48"
          />
        </div>
        {/* Live notification bell */}
        <NotificationBell />
      </div>
    </header>
  );
}
