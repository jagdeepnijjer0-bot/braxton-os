"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_STAGES, formatCurrency } from "@/lib/constants/projects";
import type { Database } from "@/lib/supabase/types";

type ProjectRow    = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];

interface Props {
  initial?: Partial<ProjectRow>;
  mode: "create" | "edit";
  projectId?: string;
}

interface DealOption { id: string; deal_name: string; address: string | null }

const EMPTY: ProjectInsert = {
  project_name: "",
  linked_deal_id: null,
  contractor_name: null,
  stage: "planning",
  budget: null,
  amount_spent: null,
  projected_profit: null,
  progress_percentage: 0,
  start_date: null,
  target_completion_date: null,
  notes: null,
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

export default function ProjectForm({ initial = {}, mode, projectId }: Props) {
  const router = useRouter();
  const [form, setForm]     = useState<ProjectInsert>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [deals, setDeals]   = useState<DealOption[]>([]);

  useEffect(() => {
    fetch("/api/deals?limit=200")
      .then(r => r.json())
      .then((data: DealOption[]) => Array.isArray(data) && setDeals(data))
      .catch(() => {});
  }, []);

  function set(field: keyof ProjectInsert, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  }

  function setNum(field: keyof ProjectInsert, value: string) {
    set(field, numVal(value));
  }

  // Auto-compute projected profit: budget - amount_spent
  function handleFinancialChange(field: keyof ProjectInsert, value: string) {
    const next = { ...form, [field]: numVal(value) };
    const budget  = next.budget ?? 0;
    const spent   = next.amount_spent ?? 0;
    const profit  = budget > 0 ? budget - spent : null;
    setForm({ ...next, projected_profit: profit });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project_name?.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const url    = mode === "create" ? "/api/projects" : `/api/projects/${projectId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      const saved = await res.json();
      router.push(`/projects/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const budget  = form.budget ?? 0;
  const spent   = form.amount_spent ?? 0;
  const variance = budget > 0 ? budget - spent : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Identity */}
      <Section title="Project Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Project Name" required>
              <input type="text" required value={form.project_name ?? ""} onChange={e => set("project_name", e.target.value)}
                placeholder="e.g. 14 Oak Street Refurb" className={inputCls} />
            </Field>
          </div>
          <Field label="Stage">
            <select value={form.stage ?? "planning"} onChange={e => set("stage", e.target.value)} className={inputCls}>
              {PROJECT_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Progress %" hint="Overall completion percentage">
            <input type="number" min="0" max="100" value={form.progress_percentage ?? 0}
              onChange={e => set("progress_percentage", Math.min(100, Math.max(0, Number(e.target.value))))}
              className={inputCls} />
          </Field>
          <Field label="Contractor Name">
            <input type="text" value={form.contractor_name ?? ""} onChange={e => set("contractor_name", e.target.value)}
              placeholder="e.g. J. Smith Builders" className={inputCls} />
          </Field>
          <Field label="Linked Deal" hint="Connect to a deal in your pipeline">
            <select value={form.linked_deal_id ?? ""} onChange={e => set("linked_deal_id", e.target.value)} className={inputCls}>
              <option value="">No deal linked</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>
                  {d.deal_name}{d.address ? ` — ${d.address}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start Date">
            <input type="date" value={form.start_date ?? ""} onChange={e => set("start_date", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Target Completion">
            <input type="date" value={form.target_completion_date ?? ""} onChange={e => set("target_completion_date", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Financials */}
      <Section title="Financials">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Budget" hint="Total budgeted spend">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0" step="500" value={form.budget ?? ""}
                onChange={e => handleFinancialChange("budget", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Amount Spent" hint="Total spent to date">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" min="0" step="100" value={form.amount_spent ?? ""}
                onChange={e => handleFinancialChange("amount_spent", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Projected Profit" hint="Auto-calculated: Budget − Spent">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input type="number" value={form.projected_profit ?? ""}
                onChange={e => setNum("projected_profit", e.target.value)}
                placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          {/* Budget variance preview */}
          {variance !== null && (
            <div className={`sm:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${variance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <span>{variance >= 0 ? "✅" : "⚠️"}</span>
              <span>Budget remaining: <strong>{formatCurrency(variance)}</strong>
                {variance < 0 && " — over budget"}
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <Field label="Notes">
          <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
            rows={4} placeholder="Any project context, access details, or key information..."
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
          {saving ? "Saving..." : mode === "create" ? "Create Project" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
