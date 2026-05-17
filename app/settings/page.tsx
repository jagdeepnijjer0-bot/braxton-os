"use client";

import { useState, useEffect, type ReactElement } from "react";
import { supabase } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

const tabs = ["Profile", "Workspace", "Integrations", "Notifications", "Billing"];

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

// ── Integrations placeholder ─────────────────────────────────────────────────
function IntegrationsSection() {
  const integrations = [
    { name: "Gmail", desc: "Sync emails", connected: true, icon: "G" },
    { name: "Google Calendar", desc: "Sync meetings", connected: true, icon: "C" },
    { name: "Slack", desc: "Get notifications", connected: false, icon: "S" },
    { name: "Stripe", desc: "Track payments", connected: false, icon: "St" },
    { name: "Zapier", desc: "Connect thousands of apps", connected: false, icon: "Z" },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Integrations</h3>
        <p className="text-sm text-gray-500 mt-0.5">Connect your tools to Braxton OS</p>
      </div>
      <div className="divide-y divide-gray-50">
        {integrations.map(i => (
          <div key={i.name} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">{i.icon}</div>
              <div><p className="text-sm font-medium text-gray-900">{i.name}</p><p className="text-xs text-gray-500">{i.desc}</p></div>
            </div>
            <button className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${i.connected ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {i.connected ? "Connected" : "Connect"}
            </button>
          </div>
        ))}
      </div>
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
