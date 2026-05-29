"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { DemoSession } from "@/lib/demo/session";
import BookCallButton from "./components/BookCallButton";

interface SessionData extends Omit<DemoSession, "token"> {}

const NAV_ITEMS = [
  { href: "/demo/workspace",              label: "Dashboard",        icon: "⊞" },
  { href: "/demo/workspace/deals",        label: "Deals & Projects", icon: "💼" },
  { href: "/demo/workspace/finance",      label: "Finance",          icon: "£" },
  { href: "/demo/workspace/inbox",        label: "Inbox",            icon: "✉" },
  { href: "/demo/workspace/crm",          label: "CRM",              icon: "👥" },
  { href: "/demo/workspace/outreach",     label: "Outreach",         icon: "📣" },
  { href: "/demo/workspace/tasks",        label: "Tasks",            icon: "✓" },
  { href: "/demo/workspace/calendar",     label: "Calendar",         icon: "📅" },
  { href: "/demo/workspace/reports",      label: "Reports",          icon: "📊" },
];

const PAGE_EVENTS: Record<string, string> = {
  "/demo/workspace":              "page_view",
  "/demo/workspace/deals":        "deals_viewed",
  "/demo/workspace/finance":      "finance_viewed",
  "/demo/workspace/crm":          "crm_viewed",
  "/demo/workspace/inbox":        "inbox_viewed",
  "/demo/workspace/outreach":     "outreach_viewed",
  "/demo/workspace/tasks":        "tasks_viewed",
  "/demo/workspace/calendar":     "calendar_viewed",
  "/demo/workspace/reports":      "reports_viewed",
  "/demo/workspace/automations":  "automations_viewed",
  "/demo/workspace/reserve":      "reserve_viewed",
  "/demo/services":               "demo_services_viewed",
};

function msToHMS(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

function SidebarNavLink({
  href, label, icon, active, onClick,
}: {
  href: string; label: string; icon: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-700/30 text-indigo-300 border border-indigo-700/40"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      {label}
    </Link>
  );
}

export default function DemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const track = useCallback((event_type: string, metadata?: Record<string, unknown>) => {
    void fetch("/api/demo/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type, metadata: metadata ?? {} }),
    });
  }, []);

  useEffect(() => {
    fetch("/api/demo/session")
      .then(r => r.json())
      .then((data: { valid: boolean; session?: SessionData }) => {
        if (!data.valid || !data.session) {
          router.replace("/demo/access");
        } else {
          setSession(data.session);
          setTimeLeft(new Date(data.session.expires_at).getTime() - Date.now());
        }
      })
      .catch(() => router.replace("/demo/access"))
      .finally(() => setLoading(false));
  }, [router]);

  // Track page changes
  useEffect(() => {
    if (!session) return;
    const event_type = PAGE_EVENTS[pathname] ?? "page_view";
    track(event_type, { path: pathname });
  }, [pathname, session, track]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      setTimeLeft(new Date(session.expires_at).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading your workspace…</div>
      </div>
    );
  }

  const firstName = session?.name ? session.name.split(" ")[0] : "";

  return (
    <div className="h-screen w-full bg-gray-950 flex flex-col overflow-hidden">
      {/* Demo banner */}
      <div className="bg-indigo-900/80 border-b border-indigo-700/60 px-4 py-2 flex items-center justify-between gap-2 text-sm shrink-0">
        <div className="flex items-center gap-2 text-indigo-200 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="hidden sm:block text-sm truncate">
            Demo workspace{firstName ? ` — Hi, ${firstName}!` : " — seed data only"}
          </span>
          <span className="sm:hidden text-xs font-medium">Demo</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-indigo-300 font-mono text-xs hidden md:block">
            {msToHMS(timeLeft)}
          </span>
          <Link
            href="/demo/services"
            className="hidden sm:block bg-indigo-700/60 hover:bg-indigo-600 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-indigo-600/50 whitespace-nowrap"
          >
            What We Build
          </Link>
          <BookCallButton
            variant="banner"
            label="Book Strategy Call"
            sessionName={session?.name}
            sessionEmail={session?.email}
          />
          <Link
            href="/demo/workspace/reserve"
            className="hidden lg:block text-indigo-300 hover:text-white text-xs transition-colors whitespace-nowrap"
          >
            Reserve Slot →
          </Link>
        </div>
      </div>

      {/* Mobile sticky header (hidden on lg+) */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-800 px-3 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-gray-400 hover:text-white p-2 -ml-1 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Open navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="text-white font-black text-base tracking-tight">Braxton OS</div>
        <BookCallButton
          variant="banner"
          label="Book Call"
          sessionName={session?.name}
          sessionEmail={session?.email}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <nav className="hidden lg:flex w-52 bg-gray-900 border-r border-gray-800 flex-col shrink-0">
          <div className="px-4 py-5 border-b border-gray-800 shrink-0">
            <div className="text-white font-black text-lg tracking-tight">Braxton OS</div>
            <div className="text-indigo-400 text-xs mt-0.5">Demo mode</div>
          </div>
          <div className="flex-1 min-h-0 py-4 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => (
              <SidebarNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
              />
            ))}
          </div>
          <div className="px-2 pb-3 shrink-0">
            <Link
              href="/demo/services"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                pathname === "/demo/services"
                  ? "bg-indigo-700/30 text-indigo-300 border-indigo-700/40"
                  : "text-indigo-400 border-indigo-800/60 hover:bg-indigo-800/30 hover:text-indigo-300"
              }`}
            >
              <span className="text-base w-5 text-center">🔧</span>
              What We Build
            </Link>
          </div>
          <div className="p-4 border-t border-gray-800 space-y-2 shrink-0">
            <BookCallButton
              variant="primary"
              label="Book Strategy Call"
              sessionName={session?.name}
              sessionEmail={session?.email}
              className="block w-full bg-white text-indigo-900 hover:bg-indigo-50 text-center text-sm font-bold py-2.5 rounded-lg transition-colors"
            />
            <Link
              href="/demo/workspace/reserve"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white text-center text-sm font-bold py-2.5 rounded-lg transition-colors"
            >
              Reserve Your Build Slot
            </Link>
          </div>
        </nav>

        {/* Mobile slide-over backdrop */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile slide-over panel */}
        <div
          className={`lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-gray-900 border-r border-gray-800 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-between shrink-0">
            <div>
              <div className="text-white font-black text-lg tracking-tight">Braxton OS</div>
              <div className="text-indigo-400 text-xs mt-0.5">Demo mode</div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 min-h-0 py-4 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => (
              <SidebarNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
          </div>

          <div className="px-2 pb-3 shrink-0">
            <Link
              href="/demo/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
                pathname === "/demo/services"
                  ? "bg-indigo-700/30 text-indigo-300 border-indigo-700/40"
                  : "text-indigo-400 border-indigo-800/60 hover:bg-indigo-800/30 hover:text-indigo-300"
              }`}
            >
              <span className="text-base w-5 text-center">🔧</span>
              What We Build
            </Link>
          </div>

          <div className="p-4 border-t border-gray-800 space-y-2 shrink-0">
            <BookCallButton
              variant="primary"
              label="Book Strategy Call"
              sessionName={session?.name}
              sessionEmail={session?.email}
              className="block w-full bg-white text-indigo-900 hover:bg-indigo-50 text-center text-sm font-bold py-3 rounded-lg transition-colors"
            />
            <Link
              href="/demo/workspace/reserve"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white text-center text-sm font-bold py-3 rounded-lg transition-colors"
            >
              Reserve Your Build Slot
            </Link>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
