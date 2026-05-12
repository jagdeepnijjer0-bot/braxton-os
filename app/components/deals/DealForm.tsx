"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DEAL_STAGES, INVESTOR_STATUSES, SOLICITOR_STATUSES,
  formatCurrency,
} from "@/lib/constants/deals";
import type { Database } from "@/lib/supabase/types";

type DealRow    = Database["public"]["Tables"]["deals"]["Row"];
type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];

interface Props {
  initial?: Partial<DealRow>;
  mode: "create" | "edit";
  dealId?: string;
}

interface ContactOption { id: string; name: string; company: string | null; }

const EMPTY: DealInsert = {
  deal_name: "",
  address: null,
  purchase_price: null,
  estimated_value: null,
  monthly_rent: null,
  refurb_cost: null,
  projected_profit: null,
  investor_status: "none",
  solicitor_status: "not_instructed",
  stage: "lead_found",
  notes: null,
  next_action: null,
  target_completion_date: null,
  linked_contact_id: null,
  assigned_to: null,
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

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
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

function numVal(v: unknown): number | null {
  const n = Number(v);
  return v === "" || v === null || v === undefined || isNaN(n) ? null : n;
}

export default function DealForm({ initial = {}, mode, dealId }: Props) {
  const router = useRouter();
  const [form, setForm]     = useState<DealInsert>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  useEffect(() => {
    fetch("/api/contacts?limit=200")
      .then((r) => r.json())
      .then((data: ContactOption[]) => Array.isArray(data) && setContacts(data))
      .catch(() => {});
  }, []);

  function set(field: keyof DealInsert, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  }

  function setNum(field: keyof DealInsert, value: string) {
    set(field, numVal(value));
  }

  // Auto-compute projected profit when purchase_price / estimated_value / refurb_cost change
  function handleFinancialChange(field: keyof DealInsert, value: string) {
    const next = { ...form, [field]: numVal(value) };
    const pp = next.purchase_price ?? 0;
    const ev = next.estimated_value ?? 0;
    const rc = next.refurb_cost ?? 0;
    const profit = ev > 0 ? ev - pp - rc : null;
    setForm({ ...next, projected_profit: profit });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.deal_name?.trim()) { setError("Deal name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const url    = mode === "create" ? "/api/deals" : `/api/deals/${dealId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      const saved = await res.json();
      router.push(`/deal-tracker/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  // Live profit preview
  const pp = form.purchase_price ?? 0;
  const ev = form.estimated_value ?? 0;
  const rc = form.refurb_cost ?? 0;
  const profitPreview = ev > 0 ? ev - pp - rc : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Identity */}
      <Section title="Deal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Deal Name" required>
              <input type="text" required value={form.deal_name ?? ""} onChange={(e) => set("deal_name", e.target.value)}
                placeholder="e.g. 14 Oak Street BTL" className={inputCls} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Property Address">
              <input type="text" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)}
                placeholder="Full address of the property" className={inputCls} />
            </Field>
          </div>
          <Field label="Stage">
            <select value={form.stage ?? "lead_found"} onChange={(e) => set("stage", e.target.value)} className={inputCls}>
              {DEAL_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Target Completion">
            <input type="date" value={form.target_completion_date ?? ""} onChange={(e) => set("target_completion_date", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Financials */}
      <Section title="Financials">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Purchase Price" hint="What you're paying for the property">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0" step="1000" value={form.purchase_price ?? ""} onChange={(e) => handleFinancialChange("purchase_price", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Estimated Value (GDV)" hint="After refurb market value">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0" step="1000" value={form.estimated_value ?? ""} onChange={(e) => handleFinancialChange("estimated_value", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Monthly Rent (if BTL)">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0" step="50" value={form.monthly_rent ?? ""} onChange={(e) => setNum("monthly_rent", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Refurb Cost">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0" step="500" value={form.refurb_cost ?? ""} onChange={(e) => handleFinancialChange("refurb_cost", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Projected Profit" hint="Auto-calculated: GDV − Purchase − Refurb">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" value={form.projected_profit ?? ""} onChange={(e) => setNum("projected_profit", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          {/* Live preview */}
          {profitPreview !== null && (
            <div className={`sm:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${profitPreview >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <span>{profitPreview >= 0 ? "📈" : "📉"}</span>
              <span>Projected profit: <strong>{formatCurrency(profitPreview)}</strong></span>
            </div>
          )}
        </div>
      </Section>

      {/* Status */}
      <Section title="Status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Investor Status">
            <select value={form.investor_status ?? "none"} onChange={(e) => set("investor_status", e.target.value)} className={inputCls}>
              {INVESTOR_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Solicitor Status">
            <select value={form.solicitor_status ?? "not_instructed"} onChange={(e) => set("solicitor_status", e.target.value)} className={inputCls}>
              {SOLICITOR_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* CRM link */}
      <Section title="Linked Contact">
        <Field label="Link to CRM Contact" hint="Investor, seller, or agent from your CRM">
          <select value={form.linked_contact_id ?? ""} onChange={(e) => set("linked_contact_id", e.target.value)} className={inputCls}>
            <option value="">No contact linked</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Planning */}
      <Section title="Notes & Next Action">
        <div className="space-y-4">
          <Field label="Next Action">
            <input type="text" value={form.next_action ?? ""} onChange={(e) => set("next_action", e.target.value)}
              placeholder="e.g. Chase solicitor for update by Friday" className={inputCls} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              rows={4} placeholder="Any background, context, or deal-specific details..."
              className={`${inputCls} resize-none`} />
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
          {saving ? "Saving..." : mode === "create" ? "Add Deal" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
