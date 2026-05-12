"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PLATFORMS, INBOX_STATUSES, INBOX_PRIORITIES, INBOX_CATEGORIES,
} from "@/lib/constants/inbox";
import type { Database, InboxPlatform, InboxStatus, InboxPriority } from "@/lib/supabase/types";

type ConvInsert = Database["public"]["Tables"]["inbox_conversations"]["Insert"];
type ConvRow    = Database["public"]["Tables"]["inbox_conversations"]["Row"];

interface Props {
  initial?: Partial<ConvRow>;
  mode: "create" | "edit";
  convId?: string;
}

interface ContactOption { id: string; name: string; email: string | null }

const EMPTY: ConvInsert = {
  platform:           "email",
  subject:            null,
  contact_id:         null,
  contact_name:       null,
  contact_email:      null,
  status:             "open",
  priority:           "normal",
  assigned_category:  null,
  ai_suggested_reply: null,
  next_action:        null,
  is_read:            false,
};

const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function ConversationForm({ initial = {}, mode, convId }: Props) {
  const router = useRouter();
  const [form, setForm]     = useState<ConvInsert>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  useEffect(() => {
    fetch("/api/contacts?limit=200")
      .then(r => r.json())
      .then((d: ContactOption[]) => Array.isArray(d) && setContacts(d))
      .catch(() => {});
  }, []);

  function set(field: keyof ConvInsert, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value === "" ? null : value }));
  }

  function handleContactChange(contactId: string) {
    const contact = contacts.find(c => c.id === contactId);
    setForm(prev => ({
      ...prev,
      contact_id:    contactId || null,
      contact_name:  contact?.name ?? null,
      contact_email: contact?.email ?? null,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.platform) { setError("Platform is required."); return; }
    setSaving(true);
    setError("");
    try {
      const url    = mode === "create" ? "/api/inbox" : `/api/inbox/${convId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const saved = await res.json();
      router.push(`/inbox/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Platform selector */}
      <Section title="Platform">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PLATFORMS.map(p => (
            <button key={p.value} type="button" onClick={() => set("platform", p.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                form.platform === p.value
                  ? `${p.bg} ${p.color} border-transparent ring-2 ring-offset-1 ring-current/30`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              <span className="text-xl">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Conversation details */}
      <Section title="Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Subject / Topic">
              <input type="text" value={form.subject ?? ""} onChange={e => set("subject", e.target.value)}
                placeholder="e.g. Interested in 14 Oak Street" className={inputCls} />
            </Field>
          </div>
          <Field label="Status">
            <select value={form.status ?? "open"} onChange={e => set("status", e.target.value as InboxStatus)} className={inputCls}>
              {INBOX_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority ?? "normal"} onChange={e => set("priority", e.target.value as InboxPriority)} className={inputCls}>
              {INBOX_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={form.assigned_category ?? ""} onChange={e => set("assigned_category", e.target.value)} className={inputCls}>
              <option value="">No category</option>
              {INBOX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Link to CRM Contact">
            <select value={form.contact_id ?? ""} onChange={e => handleContactChange(e.target.value)} className={inputCls}>
              <option value="">No contact linked</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>)}
            </select>
          </Field>
          {/* Manual contact name fallback */}
          {!form.contact_id && (
            <Field label="Contact Name" hint="If not in CRM">
              <input type="text" value={form.contact_name ?? ""} onChange={e => set("contact_name", e.target.value)}
                placeholder="e.g. Jane Smith" className={inputCls} />
            </Field>
          )}
        </div>
      </Section>

      {/* AI suggested reply + next action */}
      <Section title="Reply & Actions">
        <div className="space-y-4">
          <Field label="Suggested Reply" hint="Write a draft reply to save for later">
            <textarea value={form.ai_suggested_reply ?? ""} onChange={e => set("ai_suggested_reply", e.target.value)}
              rows={3} placeholder="Draft a reply you can copy and send…"
              className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Next Action">
            <input type="text" value={form.next_action ?? ""} onChange={e => set("next_action", e.target.value)}
              placeholder="e.g. Call back by Friday" className={inputCls} />
          </Field>
        </div>
      </Section>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
          {saving ? "Saving…" : mode === "create" ? "Create Conversation" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
