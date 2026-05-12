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

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function CRMPage() {
  const router = useRouter();
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [leadFilter, setLead]       = useState("");
  const [overdueOnly, setOverdue]   = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)      params.set("search",    search);
    if (statusFilter) params.set("status",   statusFilter);
    if (leadFilter)  params.set("lead_type", leadFilter);
    if (overdueOnly) params.set("overdue",   "true");

    const res = await fetch(`/api/contacts?${params.toString()}`);
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, [search, statusFilter, leadFilter, overdueOnly]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchContacts, 300);
    return () => clearTimeout(t);
  }, [fetchContacts]);

  async function deleteContact(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  // Summary counts
  const followUpCount = contacts.filter((c) => {
    if (!c.follow_up_date) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(c.follow_up_date) <= today;
  }).length;

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={contacts.length} />
        <StatCard label="Follow-ups Due"  value={followUpCount}  alert={followUpCount > 0} />
        <StatCard label="Closed Won"      value={contacts.filter((c) => c.status === "closed_won").length} />
        <StatCard label="New This Week"   value={contacts.filter((c) => {
          const d = new Date(c.created_at);
          return Date.now() - d.getTime() < 7 * 86400000;
        }).length} />
      </div>

      {/* Search + filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Lead type filter */}
        <select
          value={leadFilter}
          onChange={(e) => setLead(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Lead Types</option>
          {LEAD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Overdue toggle */}
        <button
          onClick={() => setOverdue((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            overdueOnly
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          Overdue
        </button>

        {/* Add button */}
        <Link
          href="/crm/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Contact
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm mb-3">No contacts found.</p>
            <Link href="/crm/new" className="text-indigo-600 text-sm font-medium hover:underline">
              Add your first contact →
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Company</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Lead Type</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Follow-up</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Last Contact</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contacts.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/crm/${c.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {initials(c.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.name}</p>
                            {c.email && <p className="text-xs text-gray-400 hidden sm:block">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {c.company ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <LeadTypeBadge value={c.lead_type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={c.status} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <FollowUpBadge date={c.follow_up_date} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {timeAgo(c.last_contacted)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/crm/${c.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => deleteContact(c.id, c.name)}
                            disabled={deleting === c.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${alert ? "border-red-200" : "border-gray-200"}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${alert ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
