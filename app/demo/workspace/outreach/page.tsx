"use client";

import { useState } from "react";
import { DEMO_OUTREACH_CAMPAIGNS } from "@/lib/demo/seed";

const PLATFORM_BADGE: Record<string, string> = {
  email:     "bg-blue-50 text-blue-700 border border-blue-200",
  linkedin:  "bg-indigo-50 text-indigo-700 border border-indigo-200",
  instagram: "bg-pink-50 text-pink-700 border border-pink-200",
  whatsapp:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed: "bg-gray-100 text-gray-500 border border-gray-200",
  paused:    "bg-yellow-50 text-yellow-600 border border-yellow-200",
};

const FUNNEL_BADGE: Record<string, string> = {
  awareness:  "bg-blue-50 text-blue-600",
  nurture:    "bg-indigo-50 text-indigo-600",
  conversion: "bg-purple-50 text-purple-600",
  upsell:     "bg-amber-50 text-amber-600",
};

const CAMPAIGN_EXTRA: Record<string, {
  example_message: string;
  next_action: string;
  ai_recommendation: string;
}> = {
  "demo-campaign-1": {
    example_message: "Hi [Name], I noticed you enquired about our HMO management service a few months back but we never connected. I wanted to share a quick case study — one of our landlords was spending 12+ hours a week on maintenance coordination and tenant queries. We got that down to under 90 minutes. Worth a 15-minute call to see if the same applies to your portfolio?",
    next_action: "Follow up with non-openers after 7 days. Test subject line variant: 'Your HMO portfolio — quick question'.",
    ai_recommendation: "Reply rate of 12.7% is above average for reactivation campaigns. Consider adding a second touchpoint at day 5 targeting non-openers with a different value hook.",
  },
  "demo-campaign-2": {
    example_message: "Hi [Name], I work with property investors across the North West securing off-market deals before they hit Rightmove. We currently have 3 properties under negotiation — one in Salford at 8.2% gross yield. Happy to send the full pack if you're actively deploying capital?",
    next_action: "Send deal pack to all 24 replies. Schedule discovery calls for the 6 booked. Nurture remaining 18 with a market update email.",
    ai_recommendation: "6 booked calls from 87 contacts = 6.9% conversion. Strongest performing campaign. Consider scaling outreach volume by 2x — the message-to-meeting rate justifies increased effort.",
  },
  "demo-campaign-3": {
    example_message: "Quick one — are you still manually chasing maintenance contractors, updating spreadsheets and typing the same WhatsApp messages every week? Our AI automation layer handles all of that. 2 minutes of your time: [Video Link]. We're onboarding 3 new clients this month — would love to show you what it looks like inside.",
    next_action: "Campaign concluded. Analyse reply patterns and create follow-up sequence for the 31 who replied but didn't book. Use learnings for next Instagram push.",
    ai_recommendation: "Conversion from replies to calls (2/31 = 6.5%) suggests message resonance is high but call friction is a barrier. Next campaign: add a low-commitment CTA like 'watch a 2-min demo' before asking for a call.",
  },
  "demo-campaign-4": {
    example_message: "Hi [Name], hope the maintenance is all running smoothly! I wanted to reach out personally — a few of our maintenance clients have recently moved across to full property management and the feedback has been great. No more chasing contractors, no more tenant calls. Given we already know your properties inside-out, the transition is seamless. Worth a quick catch-up?",
    next_action: "Campaign concluded. 4 clients converted = £24k revenue. Document as case study for future upsell campaigns across wider maintenance client base.",
    ai_recommendation: "£24k from 34 contacts = £706 revenue per contact reached. Highest ROI campaign to date. Recommend running identical campaign against full maintenance client list of 89 contacts.",
  },
};

type Campaign = typeof DEMO_OUTREACH_CAMPAIGNS[number];

export default function OutreachPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? DEMO_OUTREACH_CAMPAIGNS.find(c => c.id === selectedId) ?? null : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outreach Campaigns</h1>
        <p className="text-gray-500 text-sm mt-1">{DEMO_OUTREACH_CAMPAIGNS.length} campaigns</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        See campaigns, target audiences, platforms, funnel stages, outreach angles, replies and booked calls.
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-2" : ""}`}>
        {/* Campaign cards */}
        <div className={`grid gap-4 ${selected ? "grid-cols-1" : "sm:grid-cols-2"}`}>
          {DEMO_OUTREACH_CAMPAIGNS.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isSelected={selectedId === campaign.id}
              onSelect={() => setSelectedId(selectedId === campaign.id ? null : campaign.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <CampaignDetail
            campaign={selected}
            extra={CAMPAIGN_EXTRA[selected.id]}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  isSelected,
  onSelect,
}: {
  campaign: Campaign;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const replyRate = campaign.sent > 0 ? ((campaign.replies / campaign.sent) * 100).toFixed(1) : "0";

  return (
    <div
      className={`bg-white border rounded-xl shadow-sm p-5 cursor-pointer transition-all ${
        isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">{campaign.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{campaign.goal}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[campaign.status]}`}>
          {campaign.status}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_BADGE[campaign.platform] ?? "bg-gray-100 text-gray-500"}`}>
          {campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNNEL_BADGE[campaign.funnel_stage] ?? "bg-gray-100 text-gray-500"}`}>
          {campaign.funnel_stage.charAt(0).toUpperCase() + campaign.funnel_stage.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="text-base font-black text-gray-900">{campaign.sent}</div>
          <div className="text-xs text-gray-400">Sent</div>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-gray-900">{campaign.replies}</div>
          <div className="text-xs text-gray-400">Replies</div>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-gray-900">{campaign.booked_calls}</div>
          <div className="text-xs text-gray-400">Calls</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{replyRate}% reply rate</span>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          View details →
        </button>
      </div>
    </div>
  );
}

function CampaignDetail({
  campaign,
  extra,
  onClose,
}: {
  campaign: Campaign;
  extra?: { example_message: string; next_action: string; ai_recommendation: string };
  onClose: () => void;
}) {
  const replyRate  = campaign.sent > 0 ? ((campaign.replies / campaign.sent) * 100).toFixed(1) : "0";
  const callRate   = campaign.replies > 0 ? ((campaign.booked_calls / campaign.replies) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{campaign.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Started {campaign.start_date}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[campaign.status]}`}>
            {campaign.status}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_BADGE[campaign.platform] ?? "bg-gray-100 text-gray-500"}`}>
            {campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNNEL_BADGE[campaign.funnel_stage] ?? "bg-gray-100 text-gray-500"}`}>
            {campaign.funnel_stage.charAt(0).toUpperCase() + campaign.funnel_stage.slice(1)}
          </span>
        </div>

        {/* Goal */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Campaign Goal</div>
          <p className="text-sm text-gray-700">{campaign.goal}</p>
        </div>

        {/* Target audience */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Target Audience</div>
          <p className="text-sm text-gray-700">{campaign.target_audience}</p>
        </div>

        {/* Outreach angle */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Outreach Angle</div>
          <p className="text-sm text-gray-600 italic">&ldquo;{campaign.angle}&rdquo;</p>
        </div>

        {/* Stats grid */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Performance</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-gray-900">{campaign.sent}</div>
              <div className="text-xs text-gray-400 mt-0.5">Messages Sent</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-gray-900">{campaign.replies}</div>
              <div className="text-xs text-gray-400 mt-0.5">Replies ({replyRate}%)</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-gray-900">{campaign.booked_calls}</div>
              <div className="text-xs text-gray-400 mt-0.5">Calls Booked ({callRate}%)</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-indigo-700 leading-snug">{campaign.revenue_attributed}</div>
              <div className="text-xs text-indigo-400 mt-0.5">Revenue</div>
            </div>
          </div>
        </div>

        {/* Example message */}
        {extra?.example_message && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Example Message</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
              {extra.example_message}
            </div>
          </div>
        )}

        {/* Next action */}
        {extra?.next_action && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Next Action</div>
            <p className="text-sm text-amber-800">{extra.next_action}</p>
          </div>
        )}

        {/* AI recommendation */}
        {extra?.ai_recommendation && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">AI</span>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Recommendation</span>
            </div>
            <p className="text-sm text-indigo-800 leading-relaxed">{extra.ai_recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
