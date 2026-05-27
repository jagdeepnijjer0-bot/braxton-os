import { DEMO_OUTREACH_CAMPAIGNS } from "@/lib/demo/seed";

export const metadata = { title: "Outreach — Braxton OS Demo" };

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

export default function OutreachPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outreach Campaigns</h1>
        <p className="text-gray-500 text-sm mt-1">{DEMO_OUTREACH_CAMPAIGNS.length} campaigns</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        See campaigns, target audiences, platforms, funnel stages, outreach angles, replies and booked calls.
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {DEMO_OUTREACH_CAMPAIGNS.map(campaign => (
          <div key={campaign.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 text-sm">{campaign.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{campaign.goal}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[campaign.status]}`}>
                {campaign.status}
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_BADGE[campaign.platform] ?? "bg-gray-100 text-gray-500"}`}>
                {campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNNEL_BADGE[campaign.funnel_stage] ?? "bg-gray-100 text-gray-500"}`}>
                {campaign.funnel_stage.charAt(0).toUpperCase() + campaign.funnel_stage.slice(1)}
              </span>
            </div>

            {/* Target audience */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Target Audience</div>
              <p className="text-sm text-gray-700">{campaign.target_audience}</p>
            </div>

            {/* Outreach angle */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Angle</div>
              <p className="text-sm text-gray-600 italic">&ldquo;{campaign.angle}&rdquo;</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{campaign.sent}</div>
                <div className="text-xs text-gray-400">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{campaign.replies}</div>
                <div className="text-xs text-gray-400">Replies</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{campaign.booked_calls}</div>
                <div className="text-xs text-gray-400">Calls Booked</div>
              </div>
            </div>

            {/* Revenue attributed */}
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">Revenue attributed</span>
              <span className="text-sm font-semibold text-gray-900">{campaign.revenue_attributed}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
