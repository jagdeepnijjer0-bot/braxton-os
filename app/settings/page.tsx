"use client";

import { useState, useEffect, type ReactElement } from "react";
import { supabase } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

const tabs = ["Profile", "Workspace", "Integrations", "AI Lab", "Notifications", "Billing"];

// ── Profile Section ───────────────────────────────────────────────────────────
function ProfileSection() {
  const [profile,   setProfile]   = useState<Record<string, string> | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [fullName,  setFullName]  = useState("");
  const [jobTitle,  setJobTitle]  = useState("");
  const [phone,     setPhone]     = useState("");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,      setNewPw]     = useState("");
  const [confirmPw,  setConfirmPw] = useState("");
  const [pwSaving,   setPwSaving]  = useState(false);
  const [pwError,    setPwError]   = useState<string | null>(null);
  const [pwSaved,    setPwSaved]   = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setProfile(d);
          setFullName(d.full_name ?? "");
          setJobTitle(d.job_title ?? "");
          setPhone(d.phone ?? "");
        }
        setLoading(false);
      });
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, job_title: jobTitle, phone }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
    }
    setSaving(false);
  }

  async function changePassword() {
    setPwError(null);
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (newPw.length < 6)    { setPwError("Password must be at least 6 characters"); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwError(error.message); } else { setPwSaved(true); setNewPw(""); setConfirmPw(""); setCurrentPw(""); setTimeout(() => setPwSaved(false), 2500); }
    setPwSaving(false);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" /></div>;

  const initials = getInitials(profile?.full_name ?? profile?.email);
  const email    = profile?.email ?? "";
  const role     = profile?.role ?? "member";

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{email}</p>
            <span className="inline-block mt-1 text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{role}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input type="text" value={email} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="mt-4 flex items-center gap-3 justify-end">
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
          <button onClick={saveProfile} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-3 max-w-sm">
          {[
            { label: "New Password",     value: newPw,     set: setNewPw },
            { label: "Confirm Password", value: confirmPw, set: setConfirmPw },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              <input type="password" value={f.value} onChange={e => f.set(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSaved && <p className="text-sm text-emerald-600 font-medium">✓ Password updated</p>}
          <button onClick={changePassword} disabled={pwSaving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2">
            {pwSaving ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Workspace Section ─────────────────────────────────────────────────────────
function WorkspaceSection() {
  const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string | null; role: string }[]>([]);

  useEffect(() => {
    fetch("/api/auth/team").then(r => r.ok ? r.json() : []).then(setMembers);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Workspace Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Workspace Name", value: "Braxton HQ" },
            { label: "Industry", value: "Property / SaaS" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
              <input type="text" defaultValue={field.value} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Team Members</h3>
        <p className="text-sm text-gray-500 mb-4">Everyone with access to this workspace.</p>
        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No team members yet.</p>
          ) : members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                  {getInitials(m.full_name ?? m.email)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.full_name ?? m.email ?? "Unknown"}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>
              <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Meta Integration Section ──────────────────────────────────────────────────
type MetaSetting = {
  id: string; platform: "instagram" | "facebook";
  page_id: string | null; page_name: string | null;
  is_connected: boolean; connected_at: string | null;
};

type MetaIntegrationData = {
  settings: MetaSetting[];
  webhook_url: string;
  verify_token_configured: boolean;
  app_secret_configured: boolean;
};

function MetaIntegrationSection() {
  const [data,      setData]      = useState<MetaIntegrationData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [testing,   setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [pageIds,   setPageIds]   = useState<Record<string, string>>({});
  const [pageNames, setPageNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/integrations/meta")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setData(d);
          const ids: Record<string, string>  = {};
          const names: Record<string, string> = {};
          for (const s of d.settings) {
            ids[s.platform]   = s.page_id   ?? "";
            names[s.platform] = s.page_name ?? "";
          }
          setPageIds(ids);
          setPageNames(names);
        }
        setLoading(false);
      });
  }, []);

  async function saveSettings(platform: "instagram" | "facebook") {
    setSaving(platform);
    await fetch("/api/integrations/meta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        page_id:   pageIds[platform]   || null,
        page_name: pageNames[platform] || null,
      }),
    });
    setSaving(null);
  }

  async function toggleConnection(platform: "instagram" | "facebook", current: boolean) {
    setSaving(platform);
    const res = await fetch("/api/integrations/meta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, is_connected: !current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(prev => prev ? {
        ...prev,
        settings: prev.settings.map(s => s.platform === platform ? updated : s),
      } : prev);
    }
    setSaving(null);
  }

  async function sendTestEvent(scenario: "instagram_dm" | "facebook_message" | "facebook_lead") {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/meta/test-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, message: "Hello! I'm interested in your services." }),
      });
      const json = await res.json();
      const r = json.result;
      if (res.ok && json.ok) {
        const lines = [
          `✓ ${scenario} — processed: ${r?.processed ?? 0}, skipped: ${r?.skipped ?? 0}`,
          ...(r?.detail ?? []).map((d: string) => `  › ${d}`),
          ...(r?.errors ?? []).map((e: string) => `  ✗ ${e}`),
        ];
        setTestResult({ ok: !r?.errors?.length, lines });
      } else {
        const lines = [
          `✗ ${scenario} failed`,
          json.error ?? "Unknown error",
          ...(r?.errors ?? []).map((e: string) => `  ✗ ${e}`),
        ];
        setTestResult({ ok: false, lines });
      }
    } catch (e) {
      setTestResult({ ok: false, lines: [`✗ Network error: ${e instanceof Error ? e.message : String(e)}`] });
    }
    setTesting(false);
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const platforms: { key: "instagram" | "facebook"; label: string; icon: string; color: string; desc: string }[] = [
    { key: "instagram", label: "Instagram",        icon: "IG", color: "bg-pink-100 text-pink-700",   desc: "Receive Instagram Direct Messages in your Inbox" },
    { key: "facebook",  label: "Facebook Messenger", icon: "FB", color: "bg-blue-100 text-blue-700", desc: "Receive Facebook messages and Lead Ad submissions" },
  ];

  return (
    <div className="space-y-5">
      {/* Webhook config card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">M</div>
          <div>
            <h3 className="font-semibold text-gray-900">Meta / Instagram Integration</h3>
            <p className="text-sm text-gray-500 mt-0.5">Connect Instagram DMs and Facebook messages to your Inbox</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Webhook Configuration</p>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Callback URL (paste into Meta Developer Console)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 text-gray-700 font-mono break-all">
                {data?.webhook_url || `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/inbound/meta`}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(data?.webhook_url ?? "")}
                className="text-xs px-2 py-2 border border-gray-200 rounded hover:bg-gray-100 text-gray-500 flex-shrink-0"
              >Copy</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatusDot label="Verify Token" ok={data?.verify_token_configured ?? false} hint="META_WEBHOOK_VERIFY_TOKEN" />
            <StatusDot label="App Secret"   ok={data?.app_secret_configured   ?? false} hint="META_APP_SECRET" />
          </div>

          <p className="text-xs text-gray-400">
            Set <code className="bg-gray-100 px-1 rounded">META_WEBHOOK_VERIFY_TOKEN</code> and <code className="bg-gray-100 px-1 rounded">META_APP_SECRET</code> in your <code className="bg-gray-100 px-1 rounded">.env.local</code>. Use the same verify token in the Meta Developer Console.
          </p>
        </div>
      </div>

      {/* Per-platform settings */}
      {platforms.map(({ key, label, icon, color, desc }) => {
        const s = data?.settings.find(x => x.platform === key);
        const connected = s?.is_connected ?? false;
        return (
          <div key={key} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${color}`}>{icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {connected ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => toggleConnection(key, connected)}
                  disabled={saving === key}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${connected ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                >
                  {saving === key ? "…" : connected ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{key === "instagram" ? "Instagram Business Account ID" : "Facebook Page ID"}</label>
                <input
                  type="text"
                  value={pageIds[key] ?? ""}
                  onChange={e => setPageIds(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="e.g. 123456789012345"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
                <input
                  type="text"
                  value={pageNames[key] ?? ""}
                  onChange={e => setPageNames(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="e.g. My Business Page"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={() => saveSettings(key)}
              disabled={saving === key}
              className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving === key ? "Saving…" : "Save"}
            </button>
          </div>
        );
      })}

      {/* Mock event tester */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Test Webhook Locally</h3>
        <p className="text-sm text-gray-500 mb-4">Send a mock Meta event through the full processing pipeline. Check Inbox and Notifications after each test.</p>
        <div className="flex flex-wrap gap-2">
          {([
            { scenario: "instagram_dm",     label: "Instagram DM" },
            { scenario: "facebook_message", label: "Facebook Message" },
            { scenario: "facebook_lead",    label: "Facebook Lead Ad" },
          ] as const).map(({ scenario, label }) => (
            <button
              key={scenario}
              onClick={() => sendTestEvent(scenario)}
              disabled={testing}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors"
            >
              {testing ? "Sending…" : `Send ${label}`}
            </button>
          ))}
        </div>
        {testResult && (
          <div className={`mt-3 rounded-lg p-3 text-xs font-mono space-y-0.5 ${testResult.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {testResult.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? "bg-green-500" : "bg-gray-300"}`} />
      <div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
        {!ok && <span className="text-xs text-gray-400 ml-1">({hint} not set)</span>}
      </div>
    </div>
  );
}

// ── Integrations Section ──────────────────────────────────────────────────────
function IntegrationsSection() {
  const [metaOpen, setMetaOpen] = useState(true);
  const otherIntegrations = [
    { name: "Gmail",          desc: "Sync emails",               connected: false, icon: "G" },
    { name: "Google Calendar",desc: "Sync meetings",             connected: false, icon: "C" },
    { name: "Slack",          desc: "Get notifications",         connected: false, icon: "S" },
    { name: "Stripe",         desc: "Track payments",            connected: false, icon: "St" },
    { name: "Zapier",         desc: "Connect thousands of apps", connected: false, icon: "Z" },
  ];
  return (
    <div className="space-y-5">
      {/* Meta integration — expanded by default */}
      <div>
        <button
          onClick={() => setMetaOpen(v => !v)}
          className="w-full flex items-center justify-between mb-3 text-left"
        >
          <span className="text-sm font-semibold text-gray-700">Meta / Social (Instagram &amp; Facebook)</span>
          <span className="text-gray-400 text-xs">{metaOpen ? "▲ Hide" : "▼ Show"}</span>
        </button>
        {metaOpen && <MetaIntegrationSection />}
      </div>

      {/* Other integrations */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Other Integrations</p>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {otherIntegrations.map(i => (
              <div key={i.name} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">{i.icon}</div>
                  <div><p className="text-sm font-medium text-gray-900">{i.name}</p><p className="text-xs text-gray-500">{i.desc}</p></div>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Coming soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Lab Section ────────────────────────────────────────────────────────────
function AiLabSection() {
  type Scenario = "score" | "suggest" | "smart_notify" | "sentiment";

  const [scenario,     setScenario]   = useState<Scenario>("score");
  const [contactId,    setContactId]  = useState("");
  const [convId,       setConvId]     = useState("");
  const [running,      setRunning]    = useState(false);
  const [result,       setResult]     = useState<string | null>(null);
  const [error,        setError]      = useState<string | null>(null);

  // Mock mode state
  const [mockOn,       setMockOn]     = useState<boolean | null>(null);
  const [mockReason,   setMockReason] = useState<string>("disabled");
  const [mockToggling, setMockToggling] = useState(false);

  useEffect(() => {
    fetch("/api/ai/mock-mode")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setMockOn(d.mock); setMockReason(d.reason); } })
      .catch(() => {});
  }, []);

  async function toggleMock() {
    if (mockOn === null) return;
    // Cannot turn off mock when there's no API key or env override
    if (!mockOn === false && (mockReason === "no_api_key" || mockReason === "env_override")) return;
    setMockToggling(true);
    try {
      const res = await fetch("/api/ai/mock-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !mockOn }),
      });
      const data = await res.json();
      if (data.ok) {
        setMockOn(!mockOn);
        setMockReason(!mockOn ? "user_toggle" : "disabled");
      }
    } catch { /* ignore */ }
    setMockToggling(false);
  }

  async function run() {
    setRunning(true); setResult(null); setError(null);
    try {
      const body: Record<string, unknown> = { scenario };
      if (scenario === "suggest")   body.contact_id = contactId;
      if (scenario === "sentiment") body.conversation_id = convId;

      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setRunning(false);
  }

  async function runSmartNotify() {
    setRunning(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/ai/smart-notify", { method: "POST" });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setRunning(false);
  }

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold text-gray-900">AI Lab</h3>
            <p className="text-sm text-gray-500 mt-0.5">Test AI features locally before using them in production.</p>
          </div>
        </div>

        {/* Mock mode toggle */}
        <div className={`rounded-xl border p-4 mb-4 ${mockOn ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Mock Mode</p>
                {mockOn && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    ⚡ Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {mockReason === "no_api_key"    && "Auto-enabled — no ANTHROPIC_API_KEY found. App will never crash."}
                {mockReason === "env_override"  && "Forced on by AI_MOCK_MODE=true environment variable."}
                {mockReason === "user_toggle"   && "Enabled by you. All AI outputs are deterministic fake data."}
                {mockReason === "disabled"      && "Off — real Anthropic API will be called for all AI operations."}
              </p>
            </div>
            <button
              onClick={toggleMock}
              disabled={mockToggling || mockOn === null || mockReason === "no_api_key" || mockReason === "env_override"}
              title={
                mockReason === "no_api_key"   ? "Cannot disable — no API key configured" :
                mockReason === "env_override" ? "Cannot disable — set via AI_MOCK_MODE env var" : undefined
              }
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                mockOn ? "bg-amber-400" : "bg-gray-300"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${mockOn ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Provider info */}
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">AI Provider</p>
          <div className="space-y-1 text-sm text-violet-900">
            <p><strong>Provider:</strong> Anthropic Claude (claude.ai)</p>
            <p><strong>Models:</strong> claude-haiku-4-5 (scoring, suggestions, sentiment) · claude-sonnet-4-6 (summaries)</p>
            <p><strong>Env var required:</strong> <code className="bg-violet-100 px-1 rounded">ANTHROPIC_API_KEY</code></p>
            <p><strong>Estimated cost:</strong> ~$0.001–$0.01 per operation. Haiku: $0.80/M tokens. Sonnet: $3/M tokens.</p>
          </div>
        </div>

        {/* Scenario selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Scenario</label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "score",        label: "Score mock lead" },
                { id: "suggest",      label: "Suggest tasks" },
                { id: "smart_notify", label: "Smart notification sweep" },
                { id: "sentiment",    label: "Sentiment detection" },
              ] as const).map(s => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    scenario === s.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {scenario === "score" && (
            <p className="text-sm text-gray-500">Uses a mock high-intent investor contact. No DB required.</p>
          )}
          {scenario === "suggest" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact ID</label>
              <input
                type="text"
                value={contactId}
                onChange={e => setContactId(e.target.value)}
                placeholder="Paste a real contact UUID from CRM"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          {scenario === "smart_notify" && (
            <p className="text-sm text-gray-500">Scans all contacts and tasks for overdue follow-ups, hot leads going cold, and overdue tasks. Creates real notifications.</p>
          )}
          {scenario === "sentiment" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Conversation ID</label>
              <input
                type="text"
                value={convId}
                onChange={e => setConvId(e.target.value)}
                placeholder="Paste a real conversation UUID from Inbox"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={scenario === "smart_notify" ? runSmartNotify : run}
              disabled={running}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {running ? "Running…" : "Run Test"}
            </button>
            {result && (
              <button
                onClick={() => { setResult(null); setError(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 mb-1">Error</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {result && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Result</p>
          <pre className="text-xs text-green-400 whitespace-pre-wrap overflow-auto max-h-96 font-mono">{result}</pre>
        </div>
      )}
    </div>
  );
}

// ── Notifications placeholder ─────────────────────────────────────────────────
function NotificationsSection() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
      <p className="text-sm text-gray-500">Notification preferences coming soon.</p>
    </div>
  );
}

// ── Billing placeholder ───────────────────────────────────────────────────────
function BillingSection() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Current Plan</h3>
          <p className="text-sm text-gray-500 mt-0.5">You are on the Pro plan</p>
        </div>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Pro</span>
      </div>
      <p className="text-sm text-gray-400">Billing management coming soon.</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const sectionComponents: Record<string, ReactElement> = {
  Profile:       <ProfileSection />,
  Workspace:     <WorkspaceSection />,
  Integrations:  <IntegrationsSection />,
  "AI Lab":      <AiLabSection />,
  Notifications: <NotificationsSection />,
  Billing:       <BillingSection />,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  return (
    <div className="max-w-3xl">
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tab}
          </button>
        ))}
      </div>
      {sectionComponents[activeTab]}
    </div>
  );
}
