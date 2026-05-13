"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NICHES, PLATFORMS, CAMPAIGN_STATUSES } from "@/lib/constants/outreach";
import type { Database, OutreachNiche, OutreachPlatform, CampaignStatus } from "@/lib/supabase/types";

type CampaignRow = Database["public"]["Tables"]["outreach_campaigns"]["Row"];

interface Props { initial?: Partial<CampaignRow>; campaignId?: string }

export default function CampaignForm({ initial, campaignId }: Props) {
  const router = useRouter();
  const isEdit = !!campaignId;

  const [name,        setName]        = useState(initial?.campaign_name ?? "");
  const [niche,       setNiche]       = useState<OutreachNiche>(initial?.niche    ?? "letting_agents");
  const [platform,    setPlatform]    = useState<OutreachPlatform>(initial?.platform ?? "email");
  const [status,      setStatus]      = useState<CampaignStatus>(initial?.status  ?? "draft");
  const [offer,       setOffer]       = useState(initial?.offer        ?? "");
  const [description, setDescription]= useState(initial?.description  ?? "");
  const [notes,       setNotes]       = useState(initial?.notes        ?? "");
  const [target,      setTarget]      = useState<number>(initial?.target_count ?? 0);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Campaign name is required"); return; }
    setSaving(true); setError("");

    const payload = {
      campaign_name: name.trim(),
      niche, platform, status,
      offer:       offer       || null,
      description: description || null,
      notes:       notes       || null,
      target_count: target,
    };

    const url    = isEdit ? `/api/outreach/campaigns/${campaignId}` : "/api/outreach/campaigns";
    const method = isEdit ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save"); setSaving(false); return; }
    router.push("/outreach");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <div>
        <label className={labelCls}>Campaign Name *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Letting Agent Q2 Push" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Niche</label>
          <select value={niche} onChange={e => setNiche(e.target.value as OutreachNiche)} className={inputCls}>
            {NICHES.map(n => <option key={n.value} value={n.value}>{n.icon} {n.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value as OutreachPlatform)} className={inputCls}>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as CampaignStatus)} className={inputCls}>
            {CAMPAIGN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Target Lead Count</label>
          <input type="number" min={0} value={target} onChange={e => setTarget(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Offer / Value Prop</label>
        <input type="text" value={offer} onChange={e => setOffer(e.target.value)} className={inputCls} placeholder="What are you offering?" />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="Campaign overview…" />
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="Internal notes…" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}
