"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import OutreachPipeline from "@/app/components/outreach/OutreachPipeline";
import AnalyticsPanel from "@/app/components/outreach/AnalyticsPanel";
import { getCampaignStatus, getNiche, getPlatform } from "@/lib/constants/outreach";
import type { Database, LeadStatus } from "@/lib/supabase/types";

type CampaignRow = Database["public"]["Tables"]["outreach_campaigns"]["Row"];
type LeadRow     = Database["public"]["Tables"]["outreach_leads"]["Row"];

type Tab = "pipeline" | "analytics";

function Spinner() {
  return <div className="flex items-center justify-center py-16"><div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" /></div>;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [leads,    setLeads]    = useState<LeadRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("pipeline");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        fetch(`/api/outreach/campaigns/${id}`),
        fetch(`/api/outreach/campaigns/${id}/leads`),
      ]);
      const [cData, lData] = await Promise.all([cRes.json(), lRes.json()]);
      if (!cRes.ok) return;
      setCampaign(cData);
      setLeads(Array.isArray(lData) ? lData : []);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    await fetch(`/api/outreach/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete(leadId: string) {
    if (!confirm("Remove this lead?")) return;
    setLeads(prev => prev.filter(l => l.id !== leadId));
    await fetch(`/api/outreach/leads/${leadId}`, { method: "DELETE" });
  }

  if (loading) return <Spinner />;
  if (!campaign) return <div className="p-8 text-center text-gray-500">Campaign not found.</div>;

  const s   = getCampaignStatus(campaign.status);
  const n   = getNiche(campaign.niche);
  const plt = getPlatform(campaign.platform);

  const booked = leads.filter(l => l.booked_call).length;
  const closed = leads.filter(l => l.closed_deal).length;
  const followUpsDue = leads.filter(l => {
    if (!l.next_follow_up) return false;
    return l.next_follow_up <= new Date().toISOString().split("T")[0];
  }).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href="/outreach" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Outreach</Link>
              <span className="text-gray-300">/</span>
              <span className="text-xs text-gray-700 font-medium truncate">{campaign.campaign_name}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 truncate">{campaign.campaign_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
              </span>
              <span className="text-xs text-gray-500">{n.icon} {n.label}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${plt.bg} ${plt.color}`}>{plt.icon} {plt.label}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/outreach/${id}/leads/new`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Lead
            </Link>
            <Link href={`/outreach/${id}/edit`}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              Edit
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2 flex-wrap">
          <span><strong className="text-gray-900">{leads.length}</strong> leads</span>
          <span><strong className="text-emerald-700">{booked}</strong> calls booked</span>
          <span><strong className="text-green-700">{closed}</strong> deals closed</span>
          {followUpsDue > 0 && (
            <span className="text-red-600 font-semibold">⚠ {followUpsDue} follow-up{followUpsDue > 1 ? "s" : ""} due</span>
          )}
          {campaign.offer && <span className="text-gray-400 italic truncate max-w-xs">"{campaign.offer}"</span>}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-3 border-b border-gray-100 -mb-4 pb-0">
          {(["pipeline","analytics"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold capitalize border-b-2 transition-colors ${
                tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {t === "pipeline" ? "Pipeline" : "Analytics"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "pipeline" ? (
          <div className="h-full overflow-x-auto p-4">
            <OutreachPipeline
              leads={leads} campaignId={id}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-5">
            <AnalyticsPanel campaignId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
