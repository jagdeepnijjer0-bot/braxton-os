"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/app/components/ui/Toast";

interface DeliveryLog {
  id:              string;
  created_at:      string;
  event:           string;
  url:             string;
  status:          "pending" | "success" | "failed" | "retrying";
  attempts:        number;
  http_status:     number | null;
  error_message:   string | null;
  response_ms:     number | null;
  last_attempt_at: string | null;
}

interface LogsResponse {
  logs:    DeliveryLog[];
  total:   number;
  page:    number;
  limit:   number;
  summary: { total_success: number; total_failed: number; total_pending: number };
}

const STATUS_STYLES: Record<string, string> = {
  success:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed:   "bg-red-50 text-red-700 border-red-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  retrying: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)  return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DeliveryLogs() {
  const toast    = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [data,       setData]      = useState<LogsResponse | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [retrying,   setRetrying]  = useState<string | null>(null);
  const [eventFilt,  setEventFilt] = useState("");
  const [statusFilt, setStatusFilt] = useState("");
  const [page,       setPage]      = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: "50", page: String(page) });
      if (eventFilt)  p.set("event",  eventFilt);
      if (statusFilt) p.set("status", statusFilt);
      const res = await fetch(`/api/webhooks/outbound/logs?${p}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch {
      toastRef.current.error("Failed to load delivery logs");
    } finally {
      setLoading(false);
    }
  }, [eventFilt, statusFilt, page]); // toast intentionally omitted — accessed via ref

  useEffect(() => { void load(); }, [load]);

  async function retry(id: string) {
    setRetrying(id);
    try {
      const res = await fetch("/api/webhooks/outbound/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.ok) { toastRef.current.success("Retry queued"); void load(); }
      else toastRef.current.error("Retry failed", json.error);
    } catch {
      toastRef.current.error("Retry failed", "Network error");
    } finally {
      setRetrying(null);
    }
  }

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-4">
      {/* Summary counters */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Successful", value: data.summary.total_success, color: "text-emerald-600" },
            { label: "Failed",     value: data.summary.total_failed,  color: "text-red-600" },
            { label: "Pending",    value: data.summary.total_pending, color: "text-amber-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={eventFilt}
          onChange={e => { setEventFilt(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Events</option>
          {["new_contact","hot_lead","lead_updated","task_created","task_overdue","message_received","deal_updated","deal_stage_changed","file_uploaded","website_lead","outreach_reply","overdue_followup"].map(e => (
            <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={statusFilt}
          onChange={e => { setStatusFilt(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="retrying">Retrying</option>
        </select>
        {(eventFilt || statusFilt) && (
          <button onClick={() => { setEventFilt(""); setStatusFilt(""); setPage(1); }} className="text-xs text-gray-500 hover:text-indigo-600 px-2 py-2">Clear</button>
        )}
        <div className="ml-auto">
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
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-gray-500">No delivery logs yet</p>
            <p className="text-xs text-gray-400 mt-1">Logs appear here when n8n events are dispatched</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_80px_60px_60px_80px_100px] gap-3 px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Event</span><span>URL</span><span>Status</span><span>HTTP</span><span>ms</span><span>Attempts</span><span>Time</span>
            </div>
            <div className="divide-y divide-gray-50">
              {logs.map(log => (
                <div key={log.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_80px_60px_60px_80px_100px] gap-2 md:gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors items-center">
                  <div>
                    <code className="text-xs font-mono text-gray-800">{log.event}</code>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate font-mono">{log.url}</p>
                    {log.error_message && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">{log.error_message}</p>
                    )}
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_STYLES[log.status] ?? ""}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{log.http_status ?? "—"}</div>
                  <div className="text-xs text-gray-500">{log.response_ms != null ? `${log.response_ms}` : "—"}</div>
                  <div className="text-xs text-gray-500">{log.attempts}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(log.created_at)}</span>
                    {log.status === "failed" && log.attempts < 5 && (
                      <button
                        onClick={() => retry(log.id)}
                        disabled={retrying === log.id}
                        className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors"
                      >
                        {retrying === log.id ? "…" : "Retry"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.total > data.limit && (
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}
                </p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100">Prev</button>
                  <button disabled={page * data.limit >= data.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
