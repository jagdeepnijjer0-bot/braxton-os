"use client";

import { useState, useEffect } from "react";
import { getPlatform } from "@/lib/constants/outreach";

interface Analytics {
  totals: {
    total: number; contacted: number; replied: number;
    interested: number; booked_calls: number; closed_deals: number; positive_replies: number;
  };
  rates: {
    contact_rate: number; reply_rate: number; interest_rate: number;
    book_rate: number; close_rate: number;
  };
  byPlatform: Record<string, { total: number; replied: number; booked: number; closed: number }>;
  byStatus: Record<string, number>;
}

interface Props { campaignId?: string }

function StatCard({ label, value, sub, color = "text-gray-900" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ campaignId }: Props) {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = campaignId ? `/api/outreach/analytics?campaign_id=${campaignId}` : "/api/outreach/analytics";
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [campaignId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { totals, rates, byPlatform } = data;

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Leads"    value={totals.total}         />
        <StatCard label="Contacted"      value={totals.contacted}     sub={`${rates.contact_rate}%`}  color="text-blue-700"    />
        <StatCard label="Replied"        value={totals.replied}       sub={`${rates.reply_rate}%`}    color="text-violet-700"  />
        <StatCard label="Interested"     value={totals.interested}    sub={`${rates.interest_rate}%`} color="text-amber-700"   />
        <StatCard label="Calls Booked"   value={totals.booked_calls}  sub={`${rates.book_rate}%`}     color="text-emerald-700" />
        <StatCard label="Deals Closed"   value={totals.closed_deals}  sub={`${rates.close_rate}%`}    color="text-green-700"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Conversion Funnel</h3>
          <FunnelBar label="Contacted"   value={totals.contacted}    max={totals.total}        color="bg-blue-400"    />
          <FunnelBar label="Replied"     value={totals.replied}      max={totals.total}        color="bg-violet-400"  />
          <FunnelBar label="Interested"  value={totals.interested}   max={totals.total}        color="bg-amber-400"   />
          <FunnelBar label="Booked"      value={totals.booked_calls} max={totals.total}        color="bg-emerald-400" />
          <FunnelBar label="Closed"      value={totals.closed_deals} max={totals.total}        color="bg-green-500"   />
        </div>

        {/* By platform */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">By Platform</h3>
          {Object.keys(byPlatform).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
          ) : Object.entries(byPlatform).map(([plt, stats]) => {
            const p = getPlatform(plt);
            return (
              <div key={plt} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.bg} ${p.color}`}>{p.icon} {p.label}</span>
                <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs font-bold text-gray-800">{stats.total}</p><p className="text-[10px] text-gray-400">leads</p></div>
                  <div><p className="text-xs font-bold text-violet-700">{stats.replied}</p><p className="text-[10px] text-gray-400">replied</p></div>
                  <div><p className="text-xs font-bold text-green-700">{stats.closed}</p><p className="text-[10px] text-gray-400">closed</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
