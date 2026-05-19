"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/app/components/ui/Toast";

// ── Event metadata ────────────────────────────────────────────────────────────

const EVENTS = [
  { key: "new_contact",       label: "Lead Created",       desc: "New CRM contact added",           emoji: "👤", workflow: "lead → CRM → task → notification" },
  { key: "lead_updated",      label: "Lead Updated",       desc: "CRM contact record changed",      emoji: "✏️",  workflow: "contact update → sync" },
  { key: "hot_lead",          label: "Hot Lead",           desc: "AI scored lead as hot",           emoji: "🔥", workflow: "hot lead → urgent follow-up task" },
  { key: "task_created",      label: "Task Created",       desc: "New task added",                  emoji: "✅", workflow: "task → assignment notification" },
  { key: "task_overdue",      label: "Task Overdue",       desc: "Task past its due date",          emoji: "⏰", workflow: "overdue → reminder + escalation" },
  { key: "message_received",  label: "Message Received",   desc: "New inbound inbox message",       emoji: "💬", workflow: "message → CRM sync + reply draft" },
  { key: "deal_updated",      label: "Deal Updated",       desc: "Deal record changed",             emoji: "🤝", workflow: "deal update → investor notification" },
  { key: "deal_stage_changed",label: "Deal Stage Changed", desc: "Deal moved to new stage",         emoji: "📊", workflow: "stage change → workflow trigger" },
  { key: "file_uploaded",     label: "File Uploaded",      desc: "File attachment added",           emoji: "📎", workflow: "upload → activity log" },
  { key: "website_lead",      label: "Website Lead",       desc: "Lead from website form",          emoji: "🌐", workflow: "website → CRM → welcome email" },
  { key: "outreach_reply",    label: "Outreach Reply",     desc: "Lead replied to outreach",        emoji: "📬", workflow: "reply → CRM update + task" },
  { key: "overdue_followup",  label: "Follow-up Overdue",  desc: "CRM follow-up date passed",       emoji: "📅", workflow: "overdue → reminder notification" },
] as const;

type EventKey = typeof EVENTS[number]["key"];

interface EventConfig { url?: string; enabled?: boolean }
interface N8nSettings {
  id?: string;
  enabled: boolean;
  base_url: string | null;
  event_config: Record<string, EventConfig>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-gray-300"}`} />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Copy">
      {copied
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function N8nConfig() {
  const toast = useToast();

  const [settings,    setSettings]    = useState<N8nSettings | null>(null);
  const [envStatus,   setEnvStatus]   = useState({ enabled: false, base_url: false, secret: false });
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState<string | null>(null);

  // Local edit state
  const [enabled,  setEnabled]  = useState(false);
  const [baseUrl,  setBaseUrl]  = useState("");
  const [evtCfg,   setEvtCfg]   = useState<Record<string, EventConfig>>({});

  const [secretHint] = useState(() => {
    // Generate a candidate secret — user copies and sets in env
    const arr = new Uint8Array(32);
    if (typeof window !== "undefined") crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
  });
  const [showSecret, setShowSecret] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/n8n");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const s: N8nSettings = json.settings ?? { enabled: false, base_url: null, event_config: {} };
      setSettings(s);
      setEnabled(s.enabled);
      setBaseUrl(s.base_url ?? "");
      setEvtCfg(s.event_config ?? {});
      setEnvStatus(json.env_configured ?? {});
    } catch {
      toast.error("Failed to load n8n settings");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, base_url: baseUrl || null, event_config: evtCfg }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      toast.success("Settings saved");
      await load();
    } catch (err) {
      toast.error("Save failed", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function testEvent(eventKey: string) {
    setTesting(eventKey);
    try {
      const res = await fetch("/api/integrations/n8n/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventKey }),
      });
      const json = await res.json();
      if (json.ok) toast.success(`Test sent`, `Event: ${eventKey}`);
      else toast.error("Test failed", json.error ?? "Unknown error");
    } catch {
      toast.error("Test failed", "Network error");
    } finally {
      setTesting(null);
    }
  }

  function toggleEvent(key: string) {
    setEvtCfg(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !(prev[key]?.enabled ?? true) },
    }));
  }

  function setEventUrl(key: string, url: string) {
    setEvtCfg(prev => ({
      ...prev,
      [key]: { ...prev[key], url: url || undefined },
    }));
  }

  const isConnected = settings ? settings.enabled : envStatus.enabled;
  const inboundUrl  = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/inbound/trigger`
    : "/api/webhooks/inbound/trigger";

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Connection status banner ── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isConnected ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
        <StatusDot ok={isConnected} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {isConnected ? "n8n connected" : "n8n not connected"}
          </p>
          <p className="text-xs text-gray-500">
            {isConnected
              ? `Outbound events active · ${Object.values(evtCfg).filter(e => e.enabled !== false).length} of ${EVENTS.length} events enabled`
              : "Set a base URL and enable to start sending events to n8n"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <StatusDot ok={envStatus.secret} />
          <span>Secret {envStatus.secret ? "set" : "not set"}</span>
        </div>
      </div>

      {/* ── Configuration ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Configuration</p>
            <p className="text-xs text-gray-400 mt-0.5">Set your n8n webhook base URL and enable outbound events</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <div className="w-9 h-5 bg-gray-200 peer-checked:bg-indigo-600 rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            <span className="ml-2 text-xs font-medium text-gray-700">{enabled ? "Enabled" : "Disabled"}</span>
          </label>
        </div>

        <div className="p-5 space-y-4">
          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">n8n Base Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://n8n.yourcompany.com/webhook/braxton-os"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              {baseUrl && <CopyButton text={baseUrl} />}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Events will fire to <code className="bg-gray-100 px-1 rounded">{"{base_url}"}/new-contact</code>,
              {" "}<code className="bg-gray-100 px-1 rounded">{"{base_url}"}/hot-lead</code>, etc.
              Override per-event below.
            </p>
          </div>

          {/* Inbound URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Braxton OS Inbound URL (for n8n to call back)</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
              <code className="flex-1 text-xs text-gray-700 truncate">{inboundUrl}</code>
              <CopyButton text={inboundUrl} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Use this URL in your n8n HTTP Request nodes to trigger Braxton OS actions.</p>
          </div>

          {/* Webhook secret */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">HMAC Signing Secret</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
              <code className="flex-1 text-xs text-gray-700 truncate font-mono">
                {envStatus.secret ? (showSecret ? secretHint : "••••••••••••••••••••••••••••••••") : "Not configured"}
              </code>
              {envStatus.secret && (
                <button onClick={() => setShowSecret(v => !v)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showSecret
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              )}
              {!envStatus.secret && <CopyButton text={secretHint} />}
            </div>
            {!envStatus.secret && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <p className="font-semibold mb-1">Set this in your environment:</p>
                <code className="block bg-amber-100 rounded px-2 py-1 font-mono break-all">
                  N8N_WEBHOOK_SECRET={secretHint}
                </code>
                <p className="mt-1 text-amber-700">Copy this value now — it won&apos;t be shown again unless you regenerate it.</p>
              </div>
            )}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </div>

      {/* ── Events table ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-900">Outbound Events</p>
          <p className="text-xs text-gray-400 mt-0.5">Configure which events fire to n8n and override URLs per-event</p>
        </div>

        <div className="divide-y divide-gray-50">
          {EVENTS.map(evt => {
            const cfg      = evtCfg[evt.key] ?? {};
            const isOn     = cfg.enabled !== false;
            const urlValue = cfg.url ?? "";
            const isTesting = testing === evt.key;

            return (
              <div key={evt.key} className="px-5 py-3">
                {/* Top row */}
                <div className="flex items-center gap-3">
                  <span className="text-base w-6 text-center flex-shrink-0">{evt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{evt.label}</p>
                      <span className="hidden sm:inline text-xs text-gray-400">—</span>
                      <p className="hidden sm:block text-xs text-gray-400 truncate">{evt.desc}</p>
                    </div>
                    <p className="text-xs text-indigo-500 mt-0.5">{evt.workflow}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Test button */}
                    <button
                      onClick={() => testEvent(evt.key)}
                      disabled={!!testing || !enabled}
                      title={!enabled ? "Enable n8n first" : "Send test payload"}
                      className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      {isTesting ? (
                        <div className="w-3 h-3 border border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                      ) : "Test"}
                    </button>
                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input type="checkbox" className="sr-only peer" checked={isOn} onChange={() => toggleEvent(evt.key)} />
                      <div className="w-8 h-4 bg-gray-200 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                </div>

                {/* URL override (shown when enabled) */}
                {isOn && (
                  <div className="mt-2 ml-9 flex items-center gap-2">
                    <input
                      type="url"
                      value={urlValue}
                      onChange={e => setEventUrl(evt.key, e.target.value)}
                      placeholder={baseUrl ? `${baseUrl.replace(/\/$/, "")}/${evt.key.replace(/_/g, "-")} (auto)` : "Custom URL (optional)"}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-700 placeholder-gray-300"
                    />
                    {urlValue && <CopyButton text={urlValue} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save footer */}
        <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {Object.values(evtCfg).filter(e => e.enabled !== false).length} of {EVENTS.length} events enabled
          </p>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save events"}
          </button>
        </div>
      </div>

      {/* ── Inbound payloads reference ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-900">n8n → Braxton OS Actions</p>
          <p className="text-xs text-gray-400 mt-0.5">Use these in your n8n HTTP Request nodes to trigger actions in Braxton OS</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            { action: "create_task",           example: '{ "action": "create_task", "payload": { "title": "Call lead", "priority": "high", "contact_id": "...", "due_date": "2025-01-15" } }' },
            { action: "create_notification",   example: '{ "action": "create_notification", "payload": { "title": "Hot lead inbound", "body": "Score: 85", "priority": "urgent", "link_url": "/crm/..." } }' },
            { action: "update_contact_status", example: '{ "action": "update_contact_status", "payload": { "contact_id": "...", "status": "qualified" } }' },
            { action: "update_deal_stage",     example: '{ "action": "update_deal_stage", "payload": { "deal_id": "...", "stage": "offer_made" } }' },
            { action: "upsert_contact",        example: '{ "action": "upsert_contact", "payload": { "email": "lead@example.com", "name": "John Smith", "source": "website" } }' },
          ].map(({ action, example }) => (
            <div key={action} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <code className="text-xs font-bold text-indigo-700">{action}</code>
                <CopyButton text={example} />
              </div>
              <code className="text-xs text-gray-500 break-all whitespace-pre-wrap">{example}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
