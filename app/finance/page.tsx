"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatCurrency, formatDate, getCategory, getPaymentStatus,
  getPaymentMethod, ALL_CATEGORIES, PAYMENT_STATUSES, lastNMonths, monthLabel,
} from "@/lib/constants/finance";
import PaymentStatusBadge from "@/app/components/finance/PaymentStatusBadge";
import CategoryBadge from "@/app/components/finance/CategoryBadge";
import MonthlyChart from "@/app/components/finance/MonthlyChart";
import type { Database } from "@/lib/supabase/types";

type TxRow = Database["public"]["Tables"]["finance_transactions"]["Row"];

interface Summary {
  totals: {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    pending_income: number;
    overdue_income: number;
    pending_expenses: number;
  };
  monthly: { month: string; income: number; expenses: number; net: number }[];
  top_expense_categories: { category: string; amount: number }[];
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

function KpiCard({
  label, value, sub, subColor = "text-gray-400", icon, accent,
}: {
  label: string; value: string; sub?: string; subColor?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex gap-4 items-start">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>}
      </div>
    </div>
  );
}

const MONTHS_TO_SHOW = 6;

export default function FinancePage() {
  const router = useRouter();

  const [txs, setTxs]           = useState<TxRow[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [catFilter, setCatFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter]   = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);

  const loadTxs = useCallback(async (s: string, type: string, cat: string, status: string, month: string, rec: boolean) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (s)      p.set("search", s);
      if (type)   p.set("type", type);
      if (cat)    p.set("category", cat);
      if (status) p.set("status", status);
      if (month)  p.set("month", month);
      if (rec)    p.set("recurring", "true");
      const res  = await fetch(`/api/finance?${p}`);
      const data = await res.json();
      setTxs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res  = await fetch(`/api/finance/summary?months=${MONTHS_TO_SHOW}`);
      const data = await res.json();
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    const t = setTimeout(() => loadTxs(search, typeFilter, catFilter, statusFilter, monthFilter, recurringOnly), 280);
    return () => clearTimeout(t);
  }, [search, typeFilter, catFilter, statusFilter, monthFilter, recurringOnly, loadTxs]);

  async function deleteTx(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    setTxs(prev => prev.filter(t => t.id !== id));
    loadSummary();
    setDeleting(null);
  }

  const months = lastNMonths(MONTHS_TO_SHOW);
  const net    = summary?.totals.net_profit ?? 0;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track income, expenses and profit across your business</p>
        </div>
        <Link href="/finance/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Transaction
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Income" value={formatCurrency(summary?.totals.total_income)}
          sub={summary?.totals.pending_income ? `${formatCurrency(summary.totals.pending_income)} pending` : undefined}
          subColor="text-amber-500" accent="bg-emerald-50 text-emerald-600"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <KpiCard label="Total Expenses" value={formatCurrency(summary?.totals.total_expenses)}
          sub={summary?.totals.pending_expenses ? `${formatCurrency(summary.totals.pending_expenses)} pending` : undefined}
          subColor="text-amber-500" accent="bg-red-50 text-red-500"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
        />
        <KpiCard
          label="Net Profit"
          value={formatCurrency(net)}
          sub={net >= 0 ? "In profit" : "Running at a loss"}
          subColor={net >= 0 ? "text-emerald-600" : "text-red-500"}
          accent={net >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KpiCard label="Overdue / Unpaid"
          value={formatCurrency((summary?.totals.overdue_income ?? 0) + (summary?.totals.pending_income ?? 0))}
          sub="Income awaiting payment" subColor="text-red-500"
          accent="bg-amber-50 text-amber-600"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* Chart + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Income vs Expenses</h2>
            <span className="text-xs text-gray-400">Last {MONTHS_TO_SHOW} months</span>
          </div>
          {summaryLoading ? (
            <div className="flex items-center justify-center h-40"><div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : (
            <MonthlyChart data={summary?.monthly ?? []} />
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Expense Categories</h2>
          {summaryLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-7 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : summary?.top_expense_categories.length ? (
            <div className="space-y-2.5">
              {summary.top_expense_categories.map(({ category, amount }) => {
                const cat = getCategory(category);
                const max = summary.top_expense_categories[0].amount;
                const pct = Math.round((amount / max) * 100);
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${cat.color}`}>{cat.label}</span>
                      <span className="text-xs font-bold text-gray-700">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cat.bg.replace("bg-", "bg-").replace("100", "400")}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No expense data yet</p>
          )}
        </div>
      </div>

      {/* Monthly summary strip */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6 overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Breakdown</h2>
        <div className="flex gap-3 min-w-max">
          {months.map(ym => {
            const d = summary?.monthly.find(m => m.month === ym);
            const income   = d?.income ?? 0;
            const expenses = d?.expenses ?? 0;
            const net      = income - expenses;
            return (
              <button key={ym} onClick={() => setMonthFilter(monthFilter === ym ? "" : ym)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border text-left transition-all ${monthFilter === ym ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}>
                <p className="text-xs font-semibold text-gray-500 mb-2">{monthLabel(ym)}</p>
                <p className="text-xs text-emerald-600 font-medium">+{formatCurrency(income)}</p>
                <p className="text-xs text-red-500 font-medium">-{formatCurrency(expenses)}</p>
                <p className={`text-xs font-bold mt-1 ${net >= 0 ? "text-indigo-600" : "text-orange-500"}`}>{net >= 0 ? "+" : ""}{formatCurrency(net)}</p>
              </button>
            );
          })}
          {monthFilter && (
            <button onClick={() => setMonthFilter("")}
              className="flex-shrink-0 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 self-center">
              Clear ×
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Types</option>
          <option value="income">💰 Income</option>
          <option value="expense">💸 Expense</option>
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Categories</option>
          {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <label className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
          <input type="checkbox" checked={recurringOnly} onChange={e => setRecurringOnly(e.target.checked)} className="accent-indigo-600" />
          Recurring only
        </label>
        {(search || typeFilter || catFilter || statusFilter || monthFilter || recurringOnly) && (
          <button onClick={() => { setSearch(""); setTypeFilter(""); setCatFilter(""); setStatusFilter(""); setMonthFilter(""); setRecurringOnly(false); }}
            className="px-3.5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Transaction table */}
      {loading ? <Spinner /> : txs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">No transactions found</h3>
          <p className="text-sm text-gray-400 mb-5">
            {search || typeFilter || catFilter || statusFilter || monthFilter
              ? "Try adjusting your filters."
              : "Add your first income or expense transaction."}
          </p>
          {!search && !typeFilter && !catFilter && !statusFilter && !monthFilter && (
            <Link href="/finance/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Transaction
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${tx.transaction_type === "income" ? "bg-emerald-400" : "bg-red-400"}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{tx.item_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {tx.is_recurring && (
                              <span className="text-xs text-indigo-500 font-medium flex items-center gap-0.5">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                {tx.recurring_interval}
                              </span>
                            )}
                            {tx.quantity > 1 && (
                              <span className="text-xs text-gray-400">×{tx.quantity}</span>
                            )}
                            {tx.payment_method && (
                              <span className="text-xs text-gray-400">{getPaymentMethod(tx.payment_method)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <CategoryBadge value={tx.category} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <PaymentStatusBadge value={tx.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-bold text-sm ${tx.transaction_type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.transaction_type === "income" ? "+" : "-"}{formatCurrency(tx.total_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => router.push(`/finance/${tx.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => deleteTx(tx.id, tx.item_name)} disabled={deleting === tx.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          {deleting === tx.id
                            ? <span className="w-3 h-3 border border-gray-300 border-t-red-500 rounded-full animate-spin block" />
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="border-t-2 border-gray-100 bg-gray-50/80">
                  <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-500">
                    {txs.length} transaction{txs.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-0.5">
                      <div className="text-xs text-emerald-600 font-medium">
                        +{formatCurrency(txs.filter(t => t.transaction_type === "income").reduce((s, t) => s + Number(t.total_amount), 0))}
                      </div>
                      <div className="text-xs text-red-500 font-medium">
                        -{formatCurrency(txs.filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.total_amount), 0))}
                      </div>
                    </div>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
