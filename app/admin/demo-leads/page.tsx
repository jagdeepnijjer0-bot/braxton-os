"use client";

import { useState, useEffect, useCallback } from "react";
import { scoreLabel } from "@/lib/demo/session";

interface DemoSessionRow {
  id:               string;
  email:            string;
  name:             string;
  business_name:    string | null;
  industry:         string | null;
  problem:          string | null;
  engagement_score: number;
  package_reserved: string | null;
  expires_at:       string;
  created_at:       string;
  contact_id:       string | null;
}

const PACKAGE_NAMES: Record<string, string> = {
  starter:    "Starter OS",
  growth:     "Growth OS",
  automation: "Automation OS",
  custom:     "Custom AI OS",
};

const INTENT_COLORS: Record<string, string> = {
  low:    "bg-gray-700 text-gray-300",
  medium: "bg-yellow-900/60 text-yellow-300",
  high:   "bg-red-900/60 text-red-300",
};

export default function DemoLeadsPage() {
  const [sessions, setSessions] = useState<DemoSessionRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/demo-leads?page=${p}&limit=25`);
      const data = await res.json() as {
        sessions: DemoSessionRow[];
        total: number;
        page: number;
        total_pages: number;
      };
      setSessions(data.sessions ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
      setPage(data.page ?? 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  const highIntent = sessions.filter(s => scoreLabel(s.engagement_score) === "high").length;
  const reserved   = sessions.filter(s => s.package_reserved).length;
  const active     = sessions.filter(s => new Date(s.expires_at) > new Date()).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Demo Leads</h1>
        <p className="text-gray-400 text-sm mt-1">
          Prospects who accessed the demo workspace — {total} total
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total sessions",   value: total,      color: "indigo" },
          { label: "Active (72h)",     value: active,     color: "emerald" },
          { label: "High intent",      value: highIntent, color: "red" },
          { label: "Package reserved", value: reserved,   color: "purple" },
        ].map(s => (
          <div key={s.label} className={`bg-gray-900 border border-gray-800 rounded-xl p-4`}>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-gray-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Prospect</th>
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Intent</th>
                <th className="px-5 py-3 text-left">Reserved</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">Loading…</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">No demo sessions yet.</td>
                </tr>
              ) : sessions.map(s => {
                const intent = scoreLabel(s.engagement_score);
                const expired = new Date(s.expires_at) < new Date();
                return (
                  <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-gray-400 text-xs">{s.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-gray-300">{s.business_name ?? "—"}</div>
                      {s.industry && <div className="text-gray-500 text-xs">{s.industry}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-white">{s.engagement_score}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${INTENT_COLORS[intent]}`}>
                        {intent}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {s.package_reserved ? (
                        <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-1 rounded-full font-medium">
                          {PACKAGE_NAMES[s.package_reserved] ?? s.package_reserved}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {expired ? (
                        <span className="text-xs text-gray-500">Expired</span>
                      ) : (
                        <span className="text-xs bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Page {page} of {totalPages} — {total} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 text-sm"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
