"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ACTIVE_STAGES, DEAL_STAGES, INVESTOR_STATUSES,
  formatCurrency, formatYield,
  getDealStage,
} from "@/lib/constants/deals";
import StageBadge from "@/app/components/deals/StageBadge";
import InvestorBadge from "@/app/components/deals/InvestorBadge";
import type { Database, DealStage } from "@/lib/supabase/types";

type Deal = Database["public"]["Tables"]["deals"]["Row"] & {
  contacts?: { id: string; name: string; email: string | null; phone: string | null } | null;
};

function formatK(n: number | null): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1000) return `£${(n / 1000).toFixed(0)}k`;
  return `£${n}`;
}

function DealCard({
  deal,
  onStageChange,
  onDelete,
}: {
  deal: Deal;
  onStageChange: (id: string, stage: DealStage) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);

  async function moveStage(newStage: DealStage) {
    setMoving(true);
    const res = await fetch(`/api/deals/${deal.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    if (res.ok) onStageChange(deal.id, newStage);
    setMoving(false);
  }

  const stageIdx = DEAL_STAGES.findIndex((s) => s.value === deal.stage);
  const prevStage = stageIdx > 0 && DEAL_STAGES[stageIdx - 1].value !== "dead" ? DEAL_STAGES[stageIdx - 1] : null;
  const nextStageObj = stageIdx < DEAL_STAGES.length - 2 ? DEAL_STAGES[stageIdx + 1] : null; // not dead

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/deal-tracker/${deal.id}`)}
    >
      {/* Stage indicator strip */}
      <div className={`h-1 w-full rounded-t-xl ${getDealStage(deal.stage).dot.replace("bg-", "bg-")}`} style={{ background: "" }}>
        <div className={`h-1 w-full rounded-t-xl ${getDealStage(deal.stage).dot}`} />
      </div>

      <div className="p-3.5">
        {/* Name */}
        <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
          {deal.deal_name}
        </p>
        {deal.address && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{deal.address}</p>
        )}

        {/* Financials */}
        <div className="flex items-center gap-2 mt-2.5">
          {deal.purchase_price != null && (
            <span className="text-xs font-bold text-gray-900">{formatK(deal.purchase_price)}</span>
          )}
          {deal.projected_profit != null && (
            <span className={`text-xs font-semibold ${deal.projected_profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {deal.projected_profit >= 0 ? "+" : ""}{formatK(deal.projected_profit)}
            </span>
          )}
          {deal.monthly_rent != null && deal.purchase_price != null && (
            <span className="text-xs text-gray-400 ml-auto">
              {formatYield(deal.monthly_rent, deal.purchase_price)} yield
            </span>
          )}
        </div>

        {/* Badges */}
        {(deal.investor_status !== "none" || deal.next_action) && (
          <div className="mt-2 flex flex-wrap gap-1">
            <InvestorBadge value={deal.investor_status} />
          </div>
        )}

        {/* Next action */}
        {deal.next_action && (
          <div className="mt-2 flex items-start gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p className="text-xs text-gray-500 leading-tight line-clamp-1">{deal.next_action}</p>
          </div>
        )}

        {/* Linked contact */}
        {deal.contacts && (
          <div className="mt-2 flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-xs text-gray-400 truncate">{deal.contacts.name}</span>
          </div>
        )}

        {/* Stage move buttons */}
        <div
          className="mt-3 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1">
            {prevStage && (
              <button
                onClick={() => moveStage(prevStage.value)}
                disabled={moving}
                className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                title={`Move to ${prevStage.label}`}
              >
                ← {prevStage.label}
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {nextStageObj && (
              <button
                onClick={() => moveStage(nextStageObj.value)}
                disabled={moving}
                className="px-2 py-1 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-40 transition-colors"
                title={`Move to ${nextStageObj.label}`}
              >
                {nextStageObj.label} →
              </button>
            )}
            <button
              onClick={() => onDelete(deal.id, deal.deal_name)}
              className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DealTrackerPage() {
  const [deals, setDeals]         = useState<Deal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [stageFilter, setStage]   = useState("");
  const [investorFilter, setInvestor] = useState("");
  const [view, setView]           = useState<"kanban" | "list">("kanban");
  const router = useRouter();

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)        p.set("search", search);
    if (stageFilter)   p.set("stage", stageFilter);
    if (investorFilter) p.set("investor_status", investorFilter);
    const res = await fetch(`/api/deals?${p}`);
    if (res.ok) setDeals(await res.json());
    setLoading(false);
  }, [search, stageFilter, investorFilter]);

  useEffect(() => {
    const t = setTimeout(fetchDeals, 280);
    return () => clearTimeout(t);
  }, [fetchDeals]);

  function handleStageChange(id: string, stage: DealStage) {
    setDeals((prev) => prev.map((d) => d.id === id ? { ...d, stage } : d));
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  // ── Financial summary ──────────────────────────────────────
  const activeDeals  = deals.filter((d) => d.stage !== "dead" && d.stage !== "sold_completed");
  const pipelineValue = activeDeals.reduce((s, d) => s + (d.purchase_price ?? 0), 0);
  const totalProfit   = activeDeals.reduce((s, d) => s + (d.projected_profit ?? 0), 0);
  const inLegals      = deals.filter((d) => d.stage === "legals").length;
  const completed     = deals.filter((d) => d.stage === "sold_completed").length;

  // ── Kanban grouping ────────────────────────────────────────
  const deadDeals = deals.filter((d) => d.stage === "dead");
  const byStage = (stage: DealStage) => deals.filter((d) => d.stage === stage);

  const hasFilters = search || stageFilter || investorFilter;

  return (
    <div className="space-y-5">
      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Value",    value: formatCurrency(pipelineValue), icon: "🏠", sub: `${activeDeals.length} active deals` },
          { label: "Projected Profit",  value: formatCurrency(totalProfit),   icon: "📈", sub: totalProfit >= 0 ? "across active pipeline" : "net loss projected", alert: totalProfit < 0 },
          { label: "In Legals",         value: String(inLegals),              icon: "⚖️",  sub: "deals with solicitors" },
          { label: "Completed",         value: String(completed),             icon: "🏆", sub: "sold / completed" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white border rounded-2xl p-5 shadow-sm ${kpi.alert ? "border-red-200" : "border-gray-100"}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${kpi.alert ? "text-red-600" : "text-gray-900"}`}>
              {loading ? "—" : kpi.value}
            </p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by name or address..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={stageFilter} onChange={(e) => setStage(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Stages</option>
            {DEAL_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select value={investorFilter} onChange={(e) => setInvestor(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Investors</option>
            {INVESTOR_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {(["kanban", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {v === "kanban" ? "⠿ Kanban" : "≡ List"}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button onClick={() => { setSearch(""); setStage(""); setInvestor(""); }}
              className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-2 transition-colors">
              Clear
            </button>
          )}

          <Link href="/deal-tracker/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm whitespace-nowrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Deal
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center gap-3 py-16 text-gray-400">
          <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm">Loading deals...</span>
        </div>
      )}

      {/* Kanban view */}
      {!loading && view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: "400px" }}>
          {ACTIVE_STAGES.map((stage) => {
            const stageDeals = byStage(stage.value);
            const stageValue = stageDeals.reduce((s, d) => s + (d.purchase_price ?? 0), 0);
            return (
              <div key={stage.value} className="flex-shrink-0 w-60 flex flex-col gap-2">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                    <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stageValue > 0 && <span className="text-xs text-gray-400">{formatK(stageValue)}</span>}
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{stageDeals.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onStageChange={handleStageChange} onDelete={handleDelete} />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed border-gray-100 rounded-xl py-6 text-center">
                      <p className="text-xs text-gray-300">No deals</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Dead column (collapsed) */}
          {deadDeals.length > 0 && (
            <div className="flex-shrink-0 w-60 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-red-600">Dead</span>
                </div>
                <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">{deadDeals.length}</span>
              </div>
              <div className="flex flex-col gap-2 opacity-50">
                {deadDeals.map((deal) => (
                  <div key={deal.id} onClick={() => router.push(`/deal-tracker/${deal.id}`)}
                    className="bg-white border border-gray-100 rounded-xl p-3.5 cursor-pointer hover:opacity-100 transition-opacity">
                    <p className="text-xs font-medium text-gray-500 line-clamp-2">{deal.deal_name}</p>
                    {deal.purchase_price && <p className="text-xs text-gray-400 mt-1">{formatK(deal.purchase_price)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {!loading && view === "list" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {deals.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400">{hasFilters ? "No deals match your filters." : "No deals yet."}</p>
              {!hasFilters && (
                <Link href="/deal-tracker/new" className="mt-3 inline-flex px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  Add your first deal
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-3 bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Deal</span><span>Stage</span><span>Purchase</span><span>Profit</span><span>Investor</span><span />
              </div>
              <div className="divide-y divide-gray-50">
                {deals.map((deal) => (
                  <div key={deal.id} onClick={() => router.push(`/deal-tracker/${deal.id}`)}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr_auto] gap-2 md:gap-4 items-center px-5 py-4 hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{deal.deal_name}</p>
                      {deal.address && <p className="text-xs text-gray-400 truncate">{deal.address}</p>}
                    </div>
                    <div><StageBadge value={deal.stage} /></div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(deal.purchase_price)}</div>
                    <div className={`text-sm font-semibold ${(deal.projected_profit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {formatCurrency(deal.projected_profit)}
                    </div>
                    <div><InvestorBadge value={deal.investor_status} /></div>
                    <div onClick={(e) => e.stopPropagation()} className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/deal-tracker/${deal.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Link>
                      <button onClick={() => handleDelete(deal.id, deal.deal_name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
                {deals.length} deal{deals.length !== 1 ? "s" : ""}{hasFilters && " (filtered)"}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
