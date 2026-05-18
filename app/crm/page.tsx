"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LEAD_TYPES, CONTACT_STATUSES } from "@/lib/constants/crm";
import LeadTypeBadge from "@/app/components/crm/LeadTypeBadge";
import StatusBadge from "@/app/components/crm/StatusBadge";
import FollowUpBadge from "@/app/components/crm/FollowUpBadge";
import type { Database } from "@/lib/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

function displayName(c: Contact): string {
  if (c.name) return c.name;
  const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (c.company) return c.company;
  if (c.email)   return c.email;
  if (c.phone)   return c.phone ?? "";
  return "Unknown Contact";
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

function timeAgo(iso: string | null) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Stable avatar colour from name
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

export default function CRMPage() {
  const router = useRouter();
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [leadFilter, setLead]     = useState("");
  const [overdueOnly, setOverdue] = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)      p.set("search",    search);
    if (statusFilter) p.set("status",   statusFilter);
    if (leadFilter)  p.set("lead_type", leadFilter);
    if (overdueOnly) p.set("overdue",   "true");
    const res = await fetch(`/api/contacts?${p}`);
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, [search, statusFilter, leadFilter, overdueOnly]);

  useEffect(() => {
    const t = setTimeout(fetchContacts, 280);
    return () => clearTimeout(t);
  }, [fetchContacts]);

  async function deleteContact(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  const overdueCount = contacts.filter((c) => {
    if (!c.follow_up_date) return false;
    const t = new Date(); t.setHours(0,0,0,0);
    return new Date(c.follow_up_date) <= t;
  }).length;

  const hasFilters = search || statusFilter || leadFilter || overdueOnly;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contacts", value: contacts.length, icon: "👥", accent: "text-gray-900" },
          { label: "Follow-ups Due", value: overdueCount, icon: "⏰", accent: overdueCount > 0 ? "text-red-600" : "text-gray-900", ring: overdueCount > 0 },
          { label: "Closed Won",     value: contacts.filter((c) => c.status === "closed_won").length, icon: "🏆", accent: "text-green-700" },
          { label: "New This Week",  value: contacts.filter((c) => Date.now() - new Date(c.created_at).getTime() < 7*86400000).length, icon: "✨", accent: "text-indigo-700" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border p-5 shadow-sm ${s.ring ? "border-red-200" : "border-gray-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.accent}`}>{loading ? "—" : s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name, email, company..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Add button */}
          <Link
            href="/crm/new"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Contact
          </Link>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={leadFilter}
            onChange={(e) => setLead(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Lead Types</option>
            {LEAD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <button
            onClick={() => setOverdue((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border shadow-sm transition-all ${
              overdueOnly
                ? "bg-red-50 text-red-700 border-red-300"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Overdue only
          </button>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setStatus(""); setLead(""); setOverdue(false); }}
              className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-2 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading contacts...</span>
          </div>
        ) : contacts.length === 0 ? (
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
            {!hasFilters && (
              <Link href="/crm/new" className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Add Contact
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
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
              {contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/crm/${c.id}`)}
                  className="group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1.2fr_auto] gap-2 md:gap-4 items-center px-5 py-4">
                    {/* Contact */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(displayName(c))}`}>
                        {initials(displayName(c))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{displayName(c)}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {[c.role, c.company].filter(Boolean).join(" · ") || c.email || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Lead type */}
                    <div className="flex items-center">
                      <LeadTypeBadge value={c.lead_type} />
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <StatusBadge value={c.status} />
                    </div>

                    {/* Follow-up */}
                    <div className="flex items-center">
                      <FollowUpBadge date={c.follow_up_date} />
                    </div>

                    {/* Last contacted */}
                    <div className="flex items-center">
                      {timeAgo(c.last_contacted) ? (
                        <span className="text-xs text-gray-500">{timeAgo(c.last_contacted)}</span>
                      ) : (
                        <span className="text-xs text-gray-300">Never</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/crm/${c.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <button
                        onClick={() => deleteContact(c.id, displayName(c))}
                        disabled={deleting === c.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
              {hasFilters && " (filtered)"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
