"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NotificationItem from "./NotificationItem";
import type { Database } from "@/lib/supabase/types";

type NotifRow = Database["public"]["Tables"]["notifications"]["Row"];

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(false);
  const ref        = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false); // guard against overlapping in-flight requests

  const unread = notifs.filter(n => !n.is_read).length;

  const load = useCallback(async () => {
    if (fetchingRef.current) return; // skip if already in-flight
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Load once on mount, then poll every 5 minutes (was 60 s)
  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_read: true }) });
  }

  async function deleteNotif(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
  }

  async function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open) load(); }}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">
              Notifications {unread > 0 && <span className="text-indigo-600">({unread})</span>}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Mark all read
                </button>
              )}
              <button onClick={load} className="p-1 text-gray-400 hover:text-gray-600" title="Refresh">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? "animate-spin" : ""}>
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <span className="text-2xl mb-2">🔔</span>
                <p className="text-sm font-semibold text-gray-700">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No notifications right now.</p>
              </div>
            ) : (
              notifs.map(n => (
                <NotificationItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 text-center">
              <p className="text-[11px] text-gray-400">{notifs.length} notification{notifs.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
