import { DEMO_WEEKLY_BRIEFING, DEMO_FINANCE } from "@/lib/demo/seed";

export const metadata = { title: "Reports — Braxton OS Demo" };

export default function ReportsPage() {
  const netRevNum = 24200;
  const goalPct   = 68;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
        <p className="text-gray-500 text-sm mt-1">{DEMO_WEEKLY_BRIEFING.week}</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        Review what happened this week, what moved forward, what is overdue and what the next focus should be.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Leads This Week",   value: DEMO_WEEKLY_BRIEFING.leads_this_week,   color: "text-indigo-700 bg-indigo-50 border-indigo-200"   },
          { label: "Tasks Completed",   value: DEMO_WEEKLY_BRIEFING.tasks_completed,   color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          { label: "Tasks Overdue",     value: DEMO_WEEKLY_BRIEFING.tasks_overdue,     color: "text-red-700 bg-red-50 border-red-200"             },
          { label: "Net Revenue",       value: DEMO_WEEKLY_BRIEFING.revenue_this_week, color: "text-blue-700 bg-blue-50 border-blue-200"          },
        ].map(k => (
          <div key={k.label} className={`border rounded-xl p-4 ${k.color}`}>
            <div className="text-2xl font-black">{k.value}</div>
            <div className="text-xs mt-1 opacity-80 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">AI Insight</span>
        </div>
        <p className="text-amber-800 text-sm leading-relaxed">{DEMO_WEEKLY_BRIEFING.ai_insight}</p>
      </div>

      {/* Recommended focus */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Recommended Focus</div>
        <p className="text-indigo-800 text-sm font-medium leading-relaxed">{DEMO_WEEKLY_BRIEFING.recommended_focus}</p>
      </div>

      {/* Weekly goal */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Weekly Goal</h3>
          <span className="text-sm font-bold text-indigo-600">{goalPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${goalPct}%` }} />
        </div>
        <p className="text-sm text-gray-500">{DEMO_WEEKLY_BRIEFING.weekly_goal}</p>
      </div>

      {/* Highlights */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Highlights</h3>
        <ul className="space-y-3">
          {DEMO_WEEKLY_BRIEFING.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span className="text-sm text-gray-700">{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Revenue vs Expenses */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue vs Expenses — This Week</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-xl font-black text-emerald-700">{DEMO_WEEKLY_BRIEFING.revenue_this_week}</div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">Revenue</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-xl font-black text-red-600">{DEMO_WEEKLY_BRIEFING.expenses_this_week}</div>
            <div className="text-xs text-red-600 mt-1 font-medium">Expenses</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-xl font-black text-blue-700">
              £{(netRevNum - 3200).toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-1 font-medium">Net</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Full month P&amp;L: Revenue {DEMO_FINANCE.summary.revenue} · Expenses {DEMO_FINANCE.summary.expenses} · Net {DEMO_FINANCE.summary.net}
        </p>
      </div>
    </div>
  );
}
