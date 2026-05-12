"use client";

import { useState } from "react";
import { formatCurrency, COST_CATEGORIES } from "@/lib/constants/projects";

interface Cost {
  id: string;
  label: string;
  amount: number;
  direction: "in" | "out";
  category: string | null;
  date: string;
  notes: string | null;
}

interface Props {
  projectId: string;
  costs: Cost[];
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

export default function CostTracker({ projectId, costs: initial }: Props) {
  const [costs, setCosts] = useState<Cost[]>(initial);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "", amount: "", direction: "out" as "in" | "out",
    category: "", date: new Date().toISOString().slice(0, 10), notes: "",
  });

  const totalOut = costs.filter(c => c.direction === "out").reduce((s, c) => s + Number(c.amount), 0);
  const totalIn  = costs.filter(c => c.direction === "in").reduce((s, c) => s + Number(c.amount), 0);
  const net      = totalIn - totalOut;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.label.trim() || isNaN(amount) || amount <= 0) {
      setError("Label and a positive amount are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const created: Cost = await res.json();
      setCosts((prev) => [created, ...prev]);
      setForm({ label: "", amount: "", direction: "out", category: "", date: new Date().toISOString().slice(0, 10), notes: "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCost(costId: string) {
    setDeleting(costId);
    try {
      await fetch(`/api/projects/${projectId}/costs?costId=${costId}`, { method: "DELETE" });
      setCosts((prev) => prev.filter(c => c.id !== costId));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-red-500 mb-0.5">Money Out</p>
          <p className="text-base font-bold text-red-700">{formatCurrency(totalOut)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-emerald-600 mb-0.5">Money In</p>
          <p className="text-base font-bold text-emerald-700">{formatCurrency(totalIn)}</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${net >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}>
          <p className={`text-xs font-medium mb-0.5 ${net >= 0 ? "text-blue-500" : "text-orange-500"}`}>Net</p>
          <p className={`text-base font-bold ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>{net >= 0 ? "+" : ""}{formatCurrency(net)}</p>
        </div>
      </div>

      {/* Add cost button */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm font-medium rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {open ? "Cancel" : "Add Cost Entry"}
      </button>

      {/* Add form */}
      {open && (
        <form onSubmit={submit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
              <input type="text" required value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Labour — week 1" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount (£) *</label>
              <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select value={form.direction} onChange={e => setForm(p => ({ ...p, direction: e.target.value as "in" | "out" }))} className={inputCls}>
                <option value="out">Money Out (expense)</option>
                <option value="in">Money In (receipt)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                <option value="">No category</option>
                {COST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Cost list */}
      {costs.length > 0 && (
        <div className="space-y-2">
          {costs.map(cost => (
            <div key={cost.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white border border-gray-100 rounded-xl group">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${cost.direction === "out" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {cost.direction === "out" ? "↑" : "↓"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{cost.label}</p>
                  <p className="text-xs text-gray-400">
                    {cost.category && <span className="mr-2">{cost.category}</span>}
                    {new Date(cost.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-sm font-bold ${cost.direction === "out" ? "text-red-700" : "text-emerald-700"}`}>
                  {cost.direction === "out" ? "-" : "+"}{formatCurrency(cost.amount)}
                </span>
                <button onClick={() => deleteCost(cost.id)} disabled={deleting === cost.id}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                  {deleting === cost.id
                    ? <span className="w-3 h-3 border border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {costs.length === 0 && !open && (
        <p className="text-sm text-gray-400 text-center py-4">No cost entries yet.</p>
      )}
    </div>
  );
}
