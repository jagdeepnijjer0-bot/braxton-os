import type { ReactElement } from "react";

const stats = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", up: true },
  { label: "Active Deals", value: "38", change: "+4", up: true },
  { label: "New Contacts", value: "214", change: "+18.2%", up: true },
  { label: "Emails Sent", value: "1,840", change: "-3.1%", up: false },
];

const recentDeals = [
  { name: "Acme Corp", stage: "Proposal", value: "$24,000", owner: "Sarah K.", updated: "Today" },
  { name: "Globex Inc", stage: "Negotiation", value: "$57,500", owner: "Mike R.", updated: "Yesterday" },
  { name: "Initech", stage: "Closed Won", value: "$12,000", owner: "Tom H.", updated: "May 9" },
  { name: "Umbrella Ltd", stage: "Discovery", value: "$8,500", owner: "Sarah K.", updated: "May 8" },
  { name: "Hooli", stage: "Proposal", value: "$31,000", owner: "Jessica L.", updated: "May 7" },
];

const stageBadge: Record<string, string> = {
  Discovery: "bg-blue-100 text-blue-700",
  Proposal: "bg-yellow-100 text-yellow-700",
  Negotiation: "bg-orange-100 text-orange-700",
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
};

const recentActivity = [
  { text: "Sarah K. updated Acme Corp deal", time: "2m ago", type: "deal" },
  { text: "New contact: David Park from Initech", time: "45m ago", type: "contact" },
  { text: "Email sequence started for Hooli", time: "1h ago", type: "outreach" },
  { text: "Mike R. closed Globex Inc — $57,500", time: "3h ago", type: "win" },
  { text: "3 new replies in inbox", time: "5h ago", type: "inbox" },
];

const activityIcon: Record<string, ReactElement> = {
  deal: (
    <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    </div>
  ),
  contact: (
    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    </div>
  ),
  outreach: (
    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    </div>
  ),
  win: (
    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
    </div>
  ),
  inbox: (
    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
    </div>
  ),
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className={`text-xs font-medium mt-1 ${stat.up ? "text-green-600" : "text-red-500"}`}>
              {stat.change} vs last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Deals</h2>
            <a href="/deal-tracker" className="text-xs text-indigo-600 font-medium hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDeals.map((deal) => (
              <div key={deal.name} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                    {deal.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                    <p className="text-xs text-gray-400">{deal.owner} · {deal.updated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageBadge[deal.stage] ?? "bg-gray-100 text-gray-600"}`}>
                    {deal.stage}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">{deal.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="px-5 py-3 space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                {activityIcon[item.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Pipeline Health</h2>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden">
          <div className="bg-blue-400" style={{ width: "20%" }} title="Discovery" />
          <div className="bg-yellow-400" style={{ width: "35%" }} title="Proposal" />
          <div className="bg-orange-400" style={{ width: "25%" }} title="Negotiation" />
          <div className="bg-green-400" style={{ width: "20%" }} title="Closed Won" />
        </div>
        <div className="flex gap-6 mt-3">
          {[
            { label: "Discovery", color: "bg-blue-400", pct: "20%" },
            { label: "Proposal", color: "bg-yellow-400", pct: "35%" },
            { label: "Negotiation", color: "bg-orange-400", pct: "25%" },
            { label: "Closed Won", color: "bg-green-400", pct: "20%" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
              <span className="text-xs font-medium text-gray-700">{s.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
