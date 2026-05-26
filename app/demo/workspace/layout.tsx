"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { DemoSession } from "@/lib/demo/session";
import BookCallButton from "./components/BookCallButton";

interface SessionData extends Omit<DemoSession, "token"> {}

const NAV_ITEMS = [
  { href: "/demo/workspace",             label: "Dashboard",    icon: "📊" },
  { href: "/demo/workspace/crm",         label: "CRM",          icon: "👥" },
  { href: "/demo/workspace/inbox",       label: "Inbox",        icon: "📬" },
  { href: "/demo/workspace/tasks",       label: "Tasks",        icon: "✅" },
  { href: "/demo/workspace/automations", label: "Automations",  icon: "⚡" },
  { href: "/demo/workspace/reserve",     label: "Reserve",      icon: "🚀" },
];

const PAGE_EVENTS: Record<string, string> = {
  "/demo/workspace":             "page_view",
  "/demo/workspace/crm":         "crm_viewed",
  "/demo/workspace/inbox":       "inbox_viewed",
  "/demo/workspace/tasks":       "tasks_viewed",
  "/demo/workspace/automations": "automations_viewed",
  "/demo/workspace/reserve":     "reserve_viewed",
};

function msToHMS(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function DemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading your workspace…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Demo banner */}
      <div className="bg-indigo-900/80 border-b border-indigo-700/60 px-4 py-2 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 text-indigo-200">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span>
            Demo workspace — seed data only. Hi{session?.name ? `, ${session.name.split(" ")[0]}` : ""}!
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-indigo-300 font-mono text-xs hidden sm:block">
            Expires in {msToHMS(timeLeft)}
          </span>
          <BookCallButton
            variant="banner"
            sessionName={session?.name}
            sessionEmail={session?.email}
          />
          <Link href="/demo/workspace/reserve" className="text-indigo-300 hover:text-white text-xs transition-colors">
            Reserve package →
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="px-4 py-5 border-b border-gray-800">
            <div className="text-white font-black text-lg tracking-tight">Braxton OS</div>
            <div className="text-indigo-400 text-xs mt-0.5">Demo mode</div>
          </div>
          <div className="flex-1 py-4 px-2 space-y-1">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-700/30 text-indigo-300 border border-indigo-700/40"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                  {item.label === "Reserve" && (
                    <span className="ml-auto bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">New</span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-800 space-y-2">
            <BookCallButton
              variant="primary"
              label="Book a strategy call"
              sessionName={session?.name}
              sessionEmail={session?.email}
              className="block w-full bg-white text-indigo-900 hover:bg-indigo-50 text-center text-sm font-bold py-2.5 rounded-lg transition-colors"
            />
            <Link
              href="/demo/workspace/reserve"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white text-center text-sm font-bold py-2.5 rounded-lg transition-colors"
            >
              Reserve your OS
            </Link>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
