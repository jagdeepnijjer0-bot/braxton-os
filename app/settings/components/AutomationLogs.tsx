"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/app/components/ui/Toast";

interface AutomationLog {
  id:             string;
  created_at:     string;
  event_name:     string;
  entity_type:    string | null;
  entity_id:      string | null;
  source:         string;
  triggered_by:   string | null;
  payload:        Record<string, unknown> | null;
  webhooks_fired: number;
  status:         "ok" | "partial" | "failed";
  error_message:  string | null;
}

const STATUS_STYLES: Record<string, string> = {
  ok:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  failed:  "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, string> = { ok: "✓", partial: "~", failed: "✗" };

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)    return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AutomationLogs() {
  const toast    = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [logs,      setLogs]      = useState<AutomationLog[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [eventFilt, setEventFilt] = useState("");
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (eventFilt) p.set("event_name", eventFilt);
      const res = await fetch(`/api/webhooks/automation-logs?${p}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setLogs(json.logs ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toastRef.current.error("Failed to load automation logs");
    } finally {
      setLoading(false);
    }
  }, [eventFilt, page]); // toast intentionally omitted — accessed via ref

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={eventFilt}
          onChange={e => { setEventFilt(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Events</option>
          {["lead.created","lead.updated","ai.hot_lead","task.created","task.overdue","message.received","deal.updated","deal.stage_changed","file.uploaded","website_lead","outreach.reply","followup.overdue"].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        {eventFilt && (
          <button onClick={() => { setEventFilt(""); setPage(1); }} className="text-xs text-gray-500 hover:text-indigo-600 px-2 py-2">Clear</button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <p className="text-xs text-gray-400">{total} total events</p>
          <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? "animate-spin" : ""}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-4">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-gray-500">No automation logs yet</p>
            <p className="text-xs text-gray-400 mt-1">Logs appear when events are emitted by Braxton OS</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_60px_80px_80px] gap-3 px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Event</span><span>Entity</span><span>Status</span><span>Webhooks</span><span>Time</span>
            </div>
            <div className="divide-y divide-gray-50">
              {logs.map(log => (
                <div key={log.id}>
                  <button
                    className="w-full grid grid-cols-1 md:grid-cols-[1.5fr_1fr_60px_80px_80px] gap-2 md:gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors text-left items-center"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <div>
                      <code className="text-xs font-mono font-semibold text-indigo-700">{log.event_name}</code>
                      {log.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{log.error_message}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.entity_type && (
                        <span>{log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}</span>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_STYLES[log.status] ?? ""}`}>
                        {STATUS_ICONS[log.status]} {log.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{log.webhooks_fired} fired</div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(log.created_at)}</div>
                  </button>

                  {/* Expanded payload */}
                  {expanded === log.id && log.payload && (
                    <div className="px-5 pb-3">
                      <pre className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700 overflow-auto max-h-48 font-mono">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {total > LIMIT && (
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100">Prev</button>
                  <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
