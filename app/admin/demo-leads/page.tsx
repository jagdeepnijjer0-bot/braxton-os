"use client";

import { useState, useEffect, useCallback } from "react";
import { scoreLabel } from "@/lib/demo/utils";

interface DemoEvent {
  event_type: string;
  created_at: string;
}

interface DemoSessionRow {
  id:                   string;
  email:                string;
  name:                 string;
  business_name:        string | null;
  industry:             string | null;
  problem:              string | null;
  bottleneck:           string | null;
  engagement_score:     number;
  package_reserved:     string | null;
  package_reserved_at:  string | null;
  book_call_clicked_at: string | null;
  expires_at:           string;
  last_active_at:       string;
  created_at:           string;
  contact_id:           string | null;
  page_views:           number;
  events:               DemoEvent[];
}

const PACKAGE_LABELS: Record<string, string> = {
  starter:    "Starter OS",
  growth:     "Growth OS",
  automation: "Automation OS",
  custom:     "Custom AI OS",
};

const INTENT_COLORS: Record<string, string> = {
  low:    "bg-gray-700/60 text-gray-400",
  medium: "bg-yellow-900/60 text-yellow-300",
  high:   "bg-red-900/60 text-red-300",
};

const SCORE_BAR_COLOR: Record<string, string> = {
  low:    "bg-gray-600",
  medium: "bg-yellow-500",
  high:   "bg-red-500",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function DemoLeadsPage() {
  const [sessions, setSessions]       = useState<DemoSessionRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState<string | null>(null);

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
  const callClicks = sessions.filter(s => s.book_call_clicked_at).length;
  const active     = sessions.filter(s => new Date(s.expires_at) > new Date()).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Demo Leads</h1>
        <p className="text-gray-400 text-sm mt-1">
          All demo workspace sessions — {total} total
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total sessions",   value: total,      sub: "all time"       },
          { label: "Active (72h)",     value: active,     sub: "session open"   },
          { label: "High intent",      value: highIntent, sub: "score ≥ 30"     },
          { label: "Package reserved", value: reserved,   sub: "intent captured" },
          { label: "Book call clicks", value: callClicks, sub: "direct intent"  },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-gray-300 text-sm font-medium mt-0.5">{s.label}</div>
            <div className="text-gray-600 text-xs">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide bg-gray-900/80">
                <th className="px-4 py-3 text-left">Prospect</th>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Bottleneck</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Reserved</th>
                <th className="px-4 py-3 text-left">Book call</th>
                <th className="px-4 py-3 text-left">Last active</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Signed up</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                    No demo sessions yet.
                  </td>
                </tr>
              ) : sessions.map(s => {
                const intent  = scoreLabel(s.engagement_score);
                const expired = new Date(s.expires_at) < new Date();
                const isOpen  = expanded === s.id;

                return (
                  <>
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-800/40 transition-colors ${isOpen ? "bg-gray-800/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{s.name}</div>
                        <div className="text-gray-400 text-xs">{s.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-300 text-sm">{s.business_name ?? "—"}</div>
                        {s.industry && <div className="text-gray-500 text-xs">{s.industry}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {s.bottleneck ? (
                          <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-1 rounded-full font-medium">
                            {s.bottleneck}
                          </span>
                        ) : s.problem ? (
                          <span className="text-xs text-gray-400">{s.problem.slice(0, 40)}{s.problem.length > 40 ? "…" : ""}</span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white text-sm w-6 shrink-0">{s.engagement_score}</span>
                          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${SCORE_BAR_COLOR[intent]}`}
                              style={{ width: `${Math.min(100, (s.engagement_score / 60) * 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${INTENT_COLORS[intent]}`}>
                            {intent}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.package_reserved ? (
                          <div>
                            <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-1 rounded-full font-medium">
                              {PACKAGE_LABELS[s.package_reserved] ?? s.package_reserved}
                            </span>
                            {s.package_reserved_at && (
                              <div className="text-gray-500 text-xs mt-1">{fmt(s.package_reserved_at)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.book_call_clicked_at ? (
                          <div>
                            <span className="text-xs bg-emerald-900/60 text-emerald-300 px-2 py-1 rounded-full font-medium">
                              Clicked
                            </span>
                            <div className="text-gray-500 text-xs mt-1">{fmt(s.book_call_clicked_at)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {fmt(s.last_active_at)}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="text-xs text-gray-500">Expired</span>
                        ) : (
                          <span className="text-xs bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {fmtDate(s.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpanded(isOpen ? null : s.id)}
                          className="text-gray-500 hover:text-gray-300 transition-colors text-xs px-2 py-1 rounded hover:bg-gray-700"
                        >
                          {isOpen ? "▲" : "▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row — event timeline */}
                    {isOpen && (
                      <tr key={`${s.id}-detail`} className="bg-gray-800/20">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="grid sm:grid-cols-2 gap-6">
                            {/* Problem / context */}
                            <div>
                              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Context</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-28 shrink-0">Bottleneck:</span>
                                  <span className="text-gray-300">{s.bottleneck ?? "—"}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-28 shrink-0">Problem:</span>
                                  <span className="text-gray-300">{s.problem ?? "—"}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-28 shrink-0">Page views:</span>
                                  <span className="text-gray-300">{s.page_views}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-28 shrink-0">Contact ID:</span>
                                  <span className="text-gray-500 font-mono text-xs">{s.contact_id ?? "—"}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-28 shrink-0">Expires:</span>
                                  <span className="text-gray-300">{fmt(s.expires_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Event timeline */}
                            <div>
                              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Event timeline ({s.events.length})
                              </div>
                              {s.events.length === 0 ? (
                                <div className="text-gray-600 text-xs">No events yet</div>
                              ) : (
                                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                  {s.events.map((e, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        <span className="text-gray-300">{e.event_type.replace(/_/g, " ")}</span>
                                      </div>
                                      <span className="text-gray-600 whitespace-nowrap shrink-0">{fmt(e.created_at)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">Page {page} of {totalPages} — {total} total</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 text-sm"
            >Prev</button>
            <button
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 text-sm"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
