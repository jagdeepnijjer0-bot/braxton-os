"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PLATFORMS, INBOX_STATUSES,
  getPlatform, getInboxPriority,
  timeAgo, initials, avatarColor,
} from "@/lib/constants/inbox";
import PlatformBadge from "@/app/components/inbox/PlatformBadge";
import InboxStatusBadge from "@/app/components/inbox/InboxStatusBadge";
import type { Database } from "@/lib/supabase/types";

type ConvRow = Database["public"]["Tables"]["inbox_conversations"]["Row"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

function PriorityDot({ value }: { value: string | null }) {
  const p = getInboxPriority(value);
  if (p.value === "normal" || p.value === "low") return null;
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} title={p.label} />;
}

function ConvCard({
  conv, isSelected, onClick,
}: { conv: ConvRow; isSelected: boolean; onClick: () => void }) {
  const av     = avatarColor(conv.contact_name);
  const unread = !conv.is_read;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50/80 transition-colors relative ${
        isSelected ? "bg-indigo-50 border-r-2 border-r-indigo-500" : ""
      }`}
    >
      {unread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
      )}
      <div className="flex items-start gap-3 pl-2">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${av}`}>
          {initials(conv.contact_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-sm truncate ${unread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
              {conv.contact_name ?? "Unknown"}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <PriorityDot value={conv.priority} />
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {conv.latest_message_at ? timeAgo(conv.latest_message_at) : timeAgo(conv.created_at)}
              </span>
            </div>
          </div>
          <p className={`text-xs truncate mb-1.5 ${unread ? "font-semibold text-gray-700" : "text-gray-500"}`}>
            {conv.subject ?? "(no subject)"}
          </p>
          <p className="text-xs text-gray-400 truncate leading-relaxed">
            {conv.latest_message ?? "No messages yet"}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <PlatformBadge value={conv.platform} size="xs" />
            <InboxStatusBadge value={conv.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const [convs, setConvs]     = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch]           = useState("");
  const [platFilter, setPlatFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [unreadOnly, setUnreadOnly]   = useState(false);

  const load = useCallback(async (s: string, plat: string, stat: string, unread: boolean) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (s)      p.set("search", s);
      if (plat)   p.set("platform", plat);
      if (stat)   p.set("status", stat);
      if (unread) p.set("unread", "true");
      const res  = await fetch(`/api/inbox?${p}`);
      const data = await res.json();
      setConvs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, platFilter, statusFilter, unreadOnly), 250);
    return () => clearTimeout(t);
  }, [search, platFilter, statusFilter, unreadOnly, load]);

  async function deleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation? All messages will be lost.")) return;
    setDeleting(id);
    await fetch(`/api/inbox/${id}`, { method: "DELETE" });
    setConvs(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  const unreadCount   = convs.filter(c => !c.is_read).length;
  const openCount     = convs.filter(c => c.status === "open").length;
  const followUpCount = convs.filter(c => c.status === "follow_up").length;
  const hasFilters    = search || platFilter || statusFilter || unreadOnly;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
            <p className="text-xs text-gray-400 mt-0.5">Unified conversations across all channels</p>
          </div>
          <Link href="/inbox/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New
          </Link>
        </div>

        {/* Quick-filter pills */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={() => setUnreadOnly(v => !v)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
              unreadOnly ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
            }`}>
            {unreadCount} unread
          </button>
          <button onClick={() => setStatusFilter(v => v === "open" ? "" : "open")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
              statusFilter === "open" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
            }`}>
            {openCount} open
          </button>
          <button onClick={() => setStatusFilter(v => v === "follow_up" ? "" : "follow_up")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
              statusFilter === "follow_up" ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
            }`}>
            {followUpCount} follow-up
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={platFilter} onChange={e => setPlatFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Statuses</option>
            {INBOX_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setPlatFilter(""); setStatusFilter(""); setUnreadOnly(false); }}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 whitespace-nowrap">
              Clear ×
            </button>
          )}
        </div>
      </div>

      {/* ── Conversation list ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? <Spinner /> : convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {hasFilters ? "No conversations match your filters" : "Inbox is empty"}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {hasFilters ? "Try clearing your filters." : "Log your first conversation to get started."}
            </p>
            {!hasFilters && (
              <Link href="/inbox/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Conversation
              </Link>
            )}
          </div>
        ) : (
          <>
            {convs.map(conv => (
              <div key={conv.id} className="relative group">
                <ConvCard
                  conv={conv}
                  isSelected={false}
                  onClick={() => router.push(`/inbox/${conv.id}`)}
                />
                {/* Hover action buttons */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <Link href={`/inbox/${conv.id}/edit`}
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 rounded-lg shadow-sm transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Link>
                  <button onClick={e => deleteConv(conv.id, e)} disabled={deleting === conv.id}
                    className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-lg shadow-sm transition-colors">
                    {deleting === conv.id
                      ? <span className="w-3 h-3 border border-gray-300 border-t-red-500 rounded-full animate-spin block" />
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    }
                  </button>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-gray-300 py-4">
              {convs.length} conversation{convs.length !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
