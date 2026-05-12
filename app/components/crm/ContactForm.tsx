"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_TYPES, CONTACT_STATUSES, SOURCE_OPTIONS } from "@/lib/constants/crm";
import type { Database } from "@/lib/supabase/types";

type ContactRow    = Database["public"]["Tables"]["contacts"]["Row"];
type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];

interface Props {
  initial?: Partial<ContactRow>;
  mode: "create" | "edit";
  contactId?: string;
}

const EMPTY: ContactInsert = {
  name:           "",
  company:        null,
  role:           null,
  email:          null,
  phone:          null,
  lead_type:      null,
  source:         null,
  status:         "new",
  notes:          null,
  follow_up_date: null,
  last_contacted: null,
  assigned_to:    null,
};

export default function ContactForm({ initial = {}, mode, contactId }: Props) {
  const router = useRouter();
  const [form, setForm]   = useState<ContactInsert>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function set(field: keyof ContactInsert, value: unknown) {
    const coerced = value === "" ? null : value;
    setForm((prev) => ({ ...prev, [field]: coerced }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const url    = mode === "create" ? "/api/contacts" : `/api/contacts/${contactId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed to save contact");
      }
      const saved = await res.json();
      router.push(`/crm/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Core identity */}
      <Section title="Contact Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input type="text" required value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith" className={inputCls} />
          </Field>
          <Field label="Company">
            <input type="text" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)}
              placeholder="Acme Properties Ltd" className={inputCls} />
          </Field>
          <Field label="Role / Job Title">
            <input type="text" value={form.role ?? ""} onChange={(e) => set("role", e.target.value)}
              placeholder="Property Manager" className={inputCls} />
          </Field>
          <Field label="Source">
            <select value={form.source ?? ""} onChange={(e) => set("source", e.target.value)} className={inputCls}>
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Contact details */}
      <Section title="Contact Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email Address">
            <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com" className={inputCls} />
          </Field>
          <Field label="Phone Number">
            <input type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)}
              placeholder="+44 7700 900000" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Lead classification */}
      <Section title="Lead Classification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Lead Type">
            <select value={form.lead_type ?? ""} onChange={(e) => set("lead_type", e.target.value)} className={inputCls}>
              <option value="">Select type...</option>
              {LEAD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status ?? "new"} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Lead type pills for quick selection */}
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Quick select type:</p>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("lead_type", form.lead_type === t.value ? null : t.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  form.lead_type === t.value
                    ? `${t.color} border-transparent`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Follow-up */}
      <Section title="Follow-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Follow-up Date">
            <input type="date" value={form.follow_up_date ?? ""} onChange={(e) => set("follow_up_date", e.target.value)}
              className={inputCls} />
          </Field>
          <Field label="Last Contacted">
            <input
              type="datetime-local"
              value={form.last_contacted ? form.last_contacted.slice(0, 16) : ""}
              onChange={(e) => set("last_contacted", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
          placeholder="Any context, background, or reminders about this contact..."
          className={`${inputCls} resize-none`}
        />
      </Section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Contact" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
