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
  const [form, setForm] = useState<ContactInsert>({ ...EMPTY, ...initial });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  function set(field: keyof ContactInsert, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
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

      const res = await fetch(url, {
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Core identity */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Contact Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *">
            <input
              type="text"
              required
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith"
              className={inputCls}
            />
          </Field>
          <Field label="Company">
            <input
              type="text"
              value={form.company ?? ""}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Acme Ltd"
              className={inputCls}
            />
          </Field>
          <Field label="Role / Job Title">
            <input
              type="text"
              value={form.role ?? ""}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Property Manager"
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+44 7700 900000"
              className={inputCls}
            />
          </Field>
          <Field label="Source">
            <select
              value={form.source ?? ""}
              onChange={(e) => set("source", e.target.value)}
              className={inputCls}
            >
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Lead classification */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Lead Type">
            <select
              value={form.lead_type ?? ""}
              onChange={(e) => set("lead_type", e.target.value)}
              className={inputCls}
            >
              <option value="">Select type...</option>
              {LEAD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status ?? "new"}
              onChange={(e) => set("status", e.target.value)}
              className={inputCls}
            >
              {CONTACT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Follow-up */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Follow-up</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Follow-up Date">
            <input
              type="date"
              value={form.follow_up_date ?? ""}
              onChange={(e) => set("follow_up_date", e.target.value)}
              className={inputCls}
            />
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
      </section>

      {/* Notes */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
          placeholder="Any notes about this contact..."
          className={`${inputCls} resize-none`}
        />
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pb-6">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Contact" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
