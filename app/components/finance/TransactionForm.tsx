"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  categoriesForType, PAYMENT_METHODS, PAYMENT_STATUSES,
  RECURRING_INTERVALS, formatCurrency,
} from "@/lib/constants/finance";
import type { Database, TransactionType } from "@/lib/supabase/types";

type TxRow    = Database["public"]["Tables"]["finance_transactions"]["Row"];
type TxInsert = Database["public"]["Tables"]["finance_transactions"]["Insert"];

interface Props {
  initial?: Partial<TxRow>;
  mode: "create" | "edit";
  txId?: string;
}

interface LinkOption { id: string; name: string }

const EMPTY: TxInsert = {
  transaction_date:  new Date().toISOString().slice(0, 10),
  transaction_type:  "expense",
  category:          "other_expense",
  item_name:         "",
  amount:            0,
  quantity:          1,
  total_amount:      0,
  payment_status:    "paid",
  payment_method:    null,
  is_recurring:      false,
  recurring_interval: null,
  linked_project_id: null,
  linked_deal_id:    null,
  linked_contact_id: null,
  notes:             null,
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

export default function TransactionForm({ initial = {}, mode, txId }: Props) {
  const router = useRouter();

  // Normalise initial so selects work
  const safeInitial: Partial<TxInsert> = {
    ...initial,
    payment_method:    initial.payment_method    ?? null,
    recurring_interval: initial.recurring_interval ?? null,
    linked_project_id: initial.linked_project_id ?? null,
    linked_deal_id:    initial.linked_deal_id    ?? null,
    linked_contact_id: initial.linked_contact_id ?? null,
  };

  const [form, setForm]     = useState<TxInsert>({ ...EMPTY, ...safeInitial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [projects, setProjects] = useState<LinkOption[]>([]);
  const [deals, setDeals]       = useState<LinkOption[]>([]);
  const [contacts, setContacts] = useState<LinkOption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects?limit=200").then(r => r.json()),
      fetch("/api/deals?limit=200").then(r => r.json()),
      fetch("/api/contacts?limit=200").then(r => r.json()),
    ]).then(([p, d, c]) => {
      if (Array.isArray(p)) setProjects(p.map((x: { id: string; project_name: string }) => ({ id: x.id, name: x.project_name })));
      if (Array.isArray(d)) setDeals(d.map((x: { id: string; deal_name: string }) => ({ id: x.id, name: x.deal_name })));
      if (Array.isArray(c)) setContacts(c.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
    }).catch(() => {});
  }, []);

  function set(field: keyof TxInsert, value: unknown) {
    setForm(prev => {
      const next = { ...prev, [field]: value === "" ? null : value };
      // Reset category when type changes
      if (field === "transaction_type") {
        const cats = categoriesForType(value as TransactionType);
        next.category = cats[0].value;
      }
      // Recompute total_amount
      const amt = Number(field === "amount" ? value : next.amount) || 0;
      const qty = Number(field === "quantity" ? value : next.quantity) || 1;
      next.total_amount = amt * qty;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.item_name?.toString().trim()) { setError("Item name is required."); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be greater than zero."); return; }
    setSaving(true);
    setError("");
    try {
      const url    = mode === "create" ? "/api/finance" : `/api/finance/${txId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      router.push("/finance");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const categories = categoriesForType(form.transaction_type);
  const totalPreview = (Number(form.amount) || 0) * (Number(form.quantity) || 1);
  const isIncome = form.transaction_type === "income";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-1 gap-1">
        {(["expense", "income"] as TransactionType[]).map(t => (
          <button key={t} type="button" onClick={() => set("transaction_type", t)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize ${
              form.transaction_type === t
                ? t === "income" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "income" ? "💰 Income" : "💸 Expense"}
          </button>
        ))}
      </div>

      {/* Details */}
      <Section title="Transaction Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Item / Description" required>
              <input type="text" required value={form.item_name ?? ""} onChange={e => set("item_name", e.target.value)}
                placeholder={isIncome ? "e.g. Client payment — John Smith" : "e.g. Plumbing labour week 2"}
                className={inputCls} />
            </Field>
          </div>
          <Field label="Category" required>
            <select value={form.category ?? ""} onChange={e => set("category", e.target.value)} className={inputCls}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" value={form.transaction_date ?? ""} onChange={e => set("transaction_date", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Amounts */}
      <Section title="Amounts">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Unit Amount" required hint="Price per unit">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0.01" step="0.01" required
                value={form.amount === 0 ? "" : form.amount}
                onChange={e => set("amount", e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0.00" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Quantity" hint="Number of units">
            <input type="number" min="1" step="1" value={form.quantity ?? 1}
              onChange={e => set("quantity", Math.max(1, Number(e.target.value)))}
              className={inputCls} />
          </Field>
          <Field label="Total Amount" hint="Auto-calculated">
            <div className={`px-3.5 py-2.5 text-sm rounded-xl font-bold border ${
              totalPreview > 0
                ? isIncome ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}>
              {totalPreview > 0 ? formatCurrency(totalPreview) : "£0.00"}
            </div>
          </Field>
        </div>
      </Section>

      {/* Payment */}
      <Section title="Payment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Payment Status">
            <select value={form.payment_status ?? "paid"} onChange={e => set("payment_status", e.target.value)} className={inputCls}>
              {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Payment Method">
            <select value={form.payment_method ?? ""} onChange={e => set("payment_method", e.target.value)} className={inputCls}>
              <option value="">Not specified</option>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Recurring */}
      <Section title="Recurring">
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" checked={form.is_recurring ?? false}
                onChange={e => set("is_recurring", e.target.checked)}
                className="sr-only" />
              <div className={`w-10 h-5 rounded-full transition-colors ${form.is_recurring ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_recurring ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">This is a recurring transaction</span>
          </label>
          {form.is_recurring && (
            <div className="pl-2">
              <Field label="Recurring Interval">
                <select value={form.recurring_interval ?? "monthly"} onChange={e => set("recurring_interval", e.target.value)} className={inputCls}>
                  {RECURRING_INTERVALS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
      </Section>

      {/* Links */}
      <Section title="Link to Project / Deal / Contact">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Project">
            <select value={form.linked_project_id ?? ""} onChange={e => set("linked_project_id", e.target.value)} className={inputCls}>
              <option value="">None</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Deal">
            <select value={form.linked_deal_id ?? ""} onChange={e => set("linked_deal_id", e.target.value)} className={inputCls}>
              <option value="">None</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Contact">
            <select value={form.linked_contact_id ?? ""} onChange={e => set("linked_contact_id", e.target.value)} className={inputCls}>
              <option value="">None</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <Field label="Notes">
          <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
            rows={3} placeholder="Any additional details or reference numbers..."
            className={`${inputCls} resize-none`} />
        </Field>
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
          {saving ? "Saving..." : mode === "create" ? "Add Transaction" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
