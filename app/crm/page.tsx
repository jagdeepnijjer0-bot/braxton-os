"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LEAD_TYPES, CONTACT_STATUSES } from "@/lib/constants/crm";
import LeadTypeBadge from "@/app/components/crm/LeadTypeBadge";
import StatusBadge from "@/app/components/crm/StatusBadge";
import FollowUpBadge from "@/app/components/crm/FollowUpBadge";
import AiScoreBadge from "@/app/components/ai/AiScoreBadge";
import { SkeletonTableRow, SkeletonStatCard } from "@/app/components/ui/Skeleton";
import Pagination from "@/app/components/ui/Pagination";
import { useToast } from "@/app/components/ui/Toast";
import type { Database } from "@/lib/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

const LIMIT = 25;

// ── Helpers ────────────────────────────────────────────────────────────────────

function displayName(c: Contact): string {
  if (c.name) return c.name;
  const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  return c.company ?? c.email ?? c.phone ?? "Unknown Contact";
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase() ?? "").join("");
}

function timeAgo(iso: string | null) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
];
function avatarColor(name: string | null | undefined) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const router = useRouter();
  const toast  = useToast();

  const [contacts,      setContacts]      = useState<Contact[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [leadFilter,    setLeadFilter]    = useState("");
  const [overdueOnly,   setOverdueOnly]   = useState(false);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchContacts = useCallback(async (p = page) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (search)       params.set("search",    search);
      if (statusFilter) params.set("status",    statusFilter);
      if (leadFilter)   params.set("lead_type", leadFilter);
      if (overdueOnly)  params.set("overdue",   "true");

      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }
      const json = await res.json();
      setContacts(json.data  ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load contacts";
      setFetchError(msg);
      toast.error("Failed to load contacts", msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, leadFilter, overdueOnly, page]);

  // Debounce filter changes, reset to page 1
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchContacts(1), 280);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, leadFilter, overdueOnly]);

  // Page change without resetting filters
  useEffect(() => {
    fetchContacts(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string, name: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    setDeleting(id);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Delete failed (${res.status})`);
      }
      setContacts(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
      toast.success("Contact deleted", `"${name}" has been removed.`);
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setLeadFilter("");
    setOverdueOnly(false);
    setPage(1);
  }

  const overdueCount = contacts.filter(c => {
    if (!c.follow_up_date) return false;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return new Date(c.follow_up_date) <= t;
  }).length;

  const hasFilters = !!(search || statusFilter || leadFilter || overdueOnly);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading && contacts.length === 0 ? (
          <>
            {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
          </>
        ) : (
          <>
            {[
              { label: "Total Contacts", value: total,             icon: "👥", accent: "text-gray-900" },
              { label: "Follow-ups Due", value: overdueCount,      icon: "⏰", accent: overdueCount > 0 ? "text-red-600" : "text-gray-900", ring: overdueCount > 0 },
              { label: "Closed Won",     value: contacts.filter(c => c.status === "closed_won").length, icon: "🏆", accent: "text-emerald-700" },
              { label: "New This Week",  value: contacts.filter(c => Date.now() - new Date(c.created_at).getTime() < 7*86_400_000).length, icon: "✨", accent: "text-indigo-700" },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm ${s.ring ? "border-red-200" : "border-gray-100"}`}>
                <span className="text-xl">{s.icon}</span>
                <p className={`text-2xl font-bold mt-2 ${s.accent}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, company..."
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <Link
            href="/crm/new"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Contact
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={leadFilter}
            onChange={e => setLeadFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Lead Types</option>
            {LEAD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {CONTACT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            onClick={() => setOverdueOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border shadow-sm transition-all ${
              overdueOnly ? "bg-red-50 text-red-700 border-red-300" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Overdue
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-2 transition-colors">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

        {/* Error state */}
        {fetchError && !loading && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-red-700">{fetchError}</p>
            </div>
            <button
              onClick={() => fetchContacts(page)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Skeleton loading */}
        {loading ? (
          <div>
            {/* Hidden header placeholder */}
            <div className="hidden md:flex gap-4 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
              {["Contact","Lead Type","Status","Follow-up","Last Contacted",""].map((h,i) => (
                <div key={i} className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${i===0?"flex-[2]":i===5?"w-16":"flex-1"}`}>{h}</div>
              ))}
            </div>
            {[...Array(8)].map((_, i) => <SkeletonTableRow key={i} cols={5} />)}
          </div>
        ) : contacts.length === 0 && !fetchError ? (
          /* Empty state */
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl">
              {hasFilters ? "🔍" : "👥"}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {hasFilters ? "No contacts match your filters" : "No contacts yet"}
            </p>
            <p className="text-xs text-gray-400">
              {hasFilters ? "Try adjusting your search or filters" : "Add your first contact to get started"}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="mt-2 px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                Clear filters
              </button>
            ) : (
              <Link href="/crm/new" className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Add Contact
              </Link>
            )}
          </div>
        ) : !fetchError ? (
          <>
            {/* Table header — desktop */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1.2fr_auto] gap-4 px-5 py-3 bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Contact</span>
              <span>Lead Type</span>
              <span>Status</span>
              <span>Follow-up</span>
              <span>Last Contacted</span>
              <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {contacts.map(c => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/crm/${c.id}`)}
                  className="group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                >
                  {/* Desktop grid row */}
                  <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1.2fr_auto] gap-4 items-center px-5 py-4">
                    {/* Contact */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(displayName(c))}`}>
                        {initials(displayName(c))}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                            {displayName(c)}
                          </p>
                          {c.ai_score_label && (
                            <AiScoreBadge score={c.ai_score} label={c.ai_score_label} compact />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {[c.role, c.company].filter(Boolean).join(" · ") || c.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div><LeadTypeBadge value={c.lead_type} /></div>
                    <div><StatusBadge value={c.status} /></div>
                    <div><FollowUpBadge date={c.follow_up_date} /></div>
                    <div>
                      {timeAgo(c.last_contacted)
                        ? <span className="text-xs text-gray-500">{timeAgo(c.last_contacted)}</span>
                        : <span className="text-xs text-gray-300">Never</span>}
                    </div>
                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => e.stopPropagation()}
                    >
                      <Link
                        href={`/crm/${c.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      {confirmDelete === c.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(c.id, displayName(c))}
                            disabled={deleting === c.id}
                            className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            {deleting === c.id ? "…" : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(c.id, displayName(c))}
                          disabled={deleting === c.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile card row */}
                  <div className="md:hidden px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(displayName(c))}`}>
                      {initials(displayName(c))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700">{displayName(c)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <StatusBadge value={c.status} />
                        {c.lead_type && <LeadTypeBadge value={c.lead_type} />}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination footer */}
            <Pagination
              page={page}
              total={total}
              limit={LIMIT}
              onChange={handlePageChange}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
