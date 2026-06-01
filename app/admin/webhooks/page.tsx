"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/app/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliveryLog {
  id:              string;
  created_at:      string;
  event:           string;
  url:             string;
  status:          "pending" | "success" | "failed" | "retrying";
  attempts:        number;
  http_status:     number | null;
  error_message:   string | null;
  response_body:   string | null;
  response_ms:     number | null;
  last_attempt_at: string | null;
}

interface LogsResponse {
  logs:       DeliveryLog[];
  total:      number;
  page:       number;
  limit:      number;
  total_pages: number;
  summary:    { total_success: number; total_failed: number; total_pending: number };
}

interface AutomationLog {
  id:             string;
  created_at:     string;
  event_name:     string;
  entity_type:    string | null;
  entity_id:      string | null;
  status:         "ok" | "partial" | "failed";
  webhooks_fired: number;
  error_message:  string | null;
}

interface AutomationResponse {
  logs:       AutomationLog[];
  total:      number;
  page:       number;
  total_pages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  success:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed:   "bg-red-50 text-red-700 border border-red-200",
  pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  retrying: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  ok:       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  partial:  "bg-amber-50 text-amber-700 border border-amber-200",
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)    return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Delivery Logs Tab ─────────────────────────────────────────────────────────

function DeliveryTab() {
  const toast    = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [data,       setData]      = useState<LogsResponse | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [retrying,   setRetrying]  = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
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
      setData(await res.json() as LogsResponse);
    } catch (e) {
      toastRef.current.error("Failed to load delivery logs");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventFilt, statusFilt, page]);

  useEffect(() => { void load(); }, [load]);

  async function retry(id: string) {
    setRetrying(id);
    try {
      const res = await fetch("/api/webhooks/outbound/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json() as { error: string }).error);
      toastRef.current.success("Retry queued");
      void load();
    } catch (e) {
      toastRef.current.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  }

  async function retryAllFailed() {
    setBulkRetrying(true);
    try {
      const failed = data?.logs.filter(l => l.status === "failed") ?? [];
      await Promise.allSettled(
        failed.map(l =>
          fetch("/api/webhooks/outbound/retry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: l.id }),
          })
        )
      );
      toastRef.current.success(`Retried ${failed.length} failed deliveries`);
      void load();
    } finally {
      setBulkRetrying(false);
    }
  }

  const summary = data?.summary;
  const failedOnPage = data?.logs.filter(l => l.status === "failed").length ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-700">{summary?.total_success ?? "—"}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Successful</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{summary?.total_failed ?? "—"}</div>
          <div className="text-xs text-red-600 mt-0.5">Failed</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{summary?.total_pending ?? "—"}</div>
          <div className="text-xs text-amber-600 mt-0.5">Pending</div>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="border rounded px-3 py-1.5 text-sm w-40"
          placeholder="Filter event…"
          value={eventFilt}
          onChange={e => { setEventFilt(e.target.value); setPage(1); }}
        />
        <select
          className="border rounded px-3 py-1.5 text-sm"
          value={statusFilt}
          onChange={e => { setStatusFilt(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="retrying">Retrying</option>
        </select>
        <button
          onClick={() => void load()}
          className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-50"
        >
          Refresh
        </button>
        {failedOnPage > 0 && (
          <button
            onClick={() => void retryAllFailed()}
            disabled={bulkRetrying}
            className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 ml-auto"
          >
            {bulkRetrying ? "Retrying…" : `Retry ${failedOnPage} failed`}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-500 py-6 text-center">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Event</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">HTTP</th>
                <th className="px-3 py-2 text-left">Ms</th>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">URL + Response</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.logs ?? []).map(log => (
                <tr key={log.id} className="hover:bg-gray-50 align-top">
                  <td className="px-3 py-2 font-mono text-xs">{log.event}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[log.status] ?? ""}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{log.http_status ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{log.response_ms != null ? `${log.response_ms}` : "—"}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{relTime(log.created_at)}</td>
                  <td className="px-3 py-2 text-xs max-w-[280px]">
                    <div className="text-gray-400 font-mono truncate" title={log.url}>{log.url}</div>
                    {log.response_body && (
                      <div className="mt-0.5 text-red-500 truncate" title={log.response_body}>{log.response_body}</div>
                    )}
                    {log.error_message && !log.response_body && (
                      <div className="mt-0.5 text-red-400">{log.error_message}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {log.status === "failed" && (
                      <button
                        onClick={() => void retry(log.id)}
                        disabled={retrying === log.id}
                        className="text-xs text-indigo-600 hover:underline disabled:opacity-40"
                      >
                        {retrying === log.id ? "…" : "Retry"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data?.logs ?? []).length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No logs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(data?.total_pages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-500 pt-1">
          <span>{data?.total} total</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
            >Prev</button>
            <span className="px-2 py-1">{page} / {data?.total_pages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.total_pages ?? 1)}
              className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Automation Logs Tab ───────────────────────────────────────────────────────

function AutomationTab() {
  const toast    = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [data,       setData]    = useState<AutomationResponse | null>(null);
  const [loading,    setLoading] = useState(true);
  const [eventFilt,  setEventFilt] = useState("");
  const [statusFilt, setStatusFilt] = useState("");
  const [page,       setPage]    = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: "50", page: String(page) });
      if (eventFilt)  p.set("event",  eventFilt);
      if (statusFilt) p.set("status", statusFilt);
      const res = await fetch(`/api/webhooks/automation-logs?${p}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json() as AutomationResponse);
    } catch (e) {
      toastRef.current.error("Failed to load automation logs");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventFilt, statusFilt, page]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="border rounded px-3 py-1.5 text-sm w-40"
          placeholder="Filter event…"
          value={eventFilt}
          onChange={e => { setEventFilt(e.target.value); setPage(1); }}
        />
        <select
          className="border rounded px-3 py-1.5 text-sm"
          value={statusFilt}
          onChange={e => { setStatusFilt(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="ok">OK</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={() => void load()}
          className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-6 text-center">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Event</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Webhooks</th>
                <th className="px-3 py-2 text-left">Entity</th>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.logs ?? []).map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{log.event_name}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[log.status] ?? ""}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{log.webhooks_fired}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {log.entity_type ? `${log.entity_type}` : "—"}
                    {log.entity_id ? <span className="ml-1 text-gray-400 font-mono">{log.entity_id.slice(0, 8)}…</span> : null}
                  </td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{relTime(log.created_at)}</td>
                  <td className="px-3 py-2 text-red-500 text-xs max-w-[200px] truncate" title={log.error_message ?? ""}>
                    {log.error_message ?? ""}
                  </td>
                </tr>
              ))}
              {(data?.logs ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No logs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(data?.total_pages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-500 pt-1">
          <span>{data?.total} total</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
            >Prev</button>
            <span className="px-2 py-1">{page} / {data?.total_pages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.total_pages ?? 1)}
              className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "delivery" | "automation";

export default function WebhookMonitoringPage() {
  const [tab, setTab] = useState<Tab>("delivery");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Webhook Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track outbound webhook deliveries and automation event logs in real time.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["delivery", "automation"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "delivery" ? "Delivery Logs" : "Automation Logs"}
          </button>
        ))}
      </div>

      {tab === "delivery"   && <DeliveryTab />}
      {tab === "automation" && <AutomationTab />}
    </div>
  );
}
