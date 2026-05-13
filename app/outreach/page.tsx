"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CAMPAIGN_STATUSES, NICHES, PLATFORMS, getCampaignStatus, getNiche, getPlatform } from "@/lib/constants/outreach";
import type { Database, CampaignStatus, OutreachNiche, OutreachPlatform } from "@/lib/supabase/types";

type CampaignRow = Database["public"]["Tables"]["outreach_campaigns"]["Row"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export default function OutreachPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [niche,     setNiche]     = useState("");
  const [platform,  setPlatform]  = useState("");

  const load = useCallback(async (s: string, st: string, ni: string, pl: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (s)  p.set("search",   s);
      if (st) p.set("status",   st);
      if (ni) p.set("niche",    ni);
      if (pl) p.set("platform", pl);
      const res  = await fetch(`/api/outreach/campaigns?${p}`);
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, status, niche, platform), 250);
    return () => clearTimeout(t);
  }, [search, status, niche, platform, load]);

  async function deleteCampaign(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Delete this campaign and all its leads?")) return;
    setDeleting(id);
    await fetch(`/api/outreach/campaigns/${id}`, { method: "DELETE" });
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  const hasFilters = search || status || niche || platform;
  const active     = campaigns.filter(c => c.status === "active").length;
  const inputCls   = "px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Outreach</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} · {active} active
            </p>
          </div>
          <Link href="/outreach/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Campaign
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-40">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
            <option value="">All Statuses</option>
            {CAMPAIGN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={niche} onChange={e => setNiche(e.target.value)} className={inputCls}>
            <option value="">All Niches</option>
            {NICHES.map(n => <option key={n.value} value={n.value}>{n.icon} {n.label}</option>)}
          </select>
          <select value={platform} onChange={e => setPlatform(e.target.value)} className={inputCls}>
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setStatus(""); setNiche(""); setPlatform(""); }}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Clear ×
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? <Spinner /> : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">📣</div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {hasFilters ? "No campaigns match your filters" : "No campaigns yet"}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {hasFilters ? "Try clearing your filters." : "Create your first outreach campaign to get started."}
            </p>
            {!hasFilters && (
              <Link href="/outreach/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Campaign
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map(c => {
              const s   = getCampaignStatus(c.status);
              const n   = getNiche(c.niche);
              const plt = getPlatform(c.platform);
              return (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link href={`/outreach/${c.id}`} className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate text-sm hover:text-indigo-700 transition-colors">{c.campaign_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.icon} {n.label}</p>
                    </Link>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>

                  {c.offer && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.offer}</p>}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${plt.bg} ${plt.color}`}>
                      {plt.icon} {plt.label}
                    </span>
                    {c.target_count > 0 && (
                      <span className="text-[10px] text-gray-400">Target: {c.target_count} leads</span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <Link href={`/outreach/${c.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                      View Pipeline →
                    </Link>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/outreach/${c.id}/edit`}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                        Edit
                      </Link>
                      <button onClick={e => deleteCampaign(c.id, e)} disabled={deleting === c.id}
                        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors">
                        {deleting === c.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
