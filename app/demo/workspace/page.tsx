import Link from "next/link";
import { DEMO_KPI, DEMO_PROJECTS, DEMO_TASKS, DEMO_ACTIVITY_TIMELINE, DEMO_WEEKLY_BRIEFING } from "@/lib/demo/seed";

export const metadata = { title: "Dashboard — Braxton OS Demo" };

const KPI_CARDS = [
  { label: "Active Leads",     value: DEMO_KPI.active_leads,    icon: "👥" },
  { label: "Open Deals",       value: DEMO_KPI.open_deals,      icon: "💼" },
  { label: "Pipeline Value",   value: DEMO_KPI.total_pipeline,  icon: "📈" },
  { label: "Tasks Due Today",  value: DEMO_KPI.tasks_due_today, icon: "✓"  },
  { label: "Unread Messages",  value: DEMO_KPI.inbox_unread,    icon: "✉"  },
  { label: "Monthly Revenue",  value: DEMO_KPI.monthly_revenue, icon: "£"  },
];

const STAGE_LABELS: Record<string, string> = {
  proposal:    "Proposal",
  negotiation: "Negotiation",
  discovery:   "Discovery",
  in_progress: "In Progress",
  closed_won:  "Closed Won",
};

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  at_risk:  "bg-red-50 text-red-600 border border-red-200",
  on_hold:  "bg-gray-100 text-gray-500 border border-gray-200",
  won:      "bg-blue-50 text-blue-700 border border-blue-200",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent:  "bg-red-50 text-red-600 border border-red-200",
  high:    "bg-orange-50 text-orange-600 border border-orange-200",
  medium:  "bg-yellow-50 text-yellow-600 border border-yellow-200",
  low:     "bg-gray-100 text-gray-500 border border-gray-200",
  overdue: "bg-red-50 text-red-600 border border-red-200",
};

const overdueTasks  = DEMO_TASKS.filter(t => t.status === "overdue").slice(0, 3);
const recentDeals   = DEMO_PROJECTS.filter(p => p.type === "deal").slice(0, 3);
const timelineItems = DEMO_ACTIVITY_TIMELINE.slice(0, 12);

export default function DemoWorkspaceDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        See the key movements across your business in one place: leads, tasks, deals, revenue, inbox activity and AI insights.
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_CARDS.map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="text-lg mb-1">{k.icon}</div>
            <div className="text-2xl font-black text-gray-900">{k.value}</div>
            <div className="text-xs text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Deals */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Deals</h2>
              <Link href="/demo/workspace/deals" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentDeals.map(deal => (
                <div key={deal.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{deal.name}</div>
                      <div className="text-xs text-gray-400">{deal.contact_name} · {STAGE_LABELS[deal.stage] ?? deal.stage}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[deal.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {deal.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        £{deal.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{deal.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Overdue Tasks</h2>
              <Link href="/demo/workspace/tasks" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {overdueTasks.map(task => (
                <div key={task.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                      <div className="text-xs text-gray-400">Due {task.due_date}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-500"}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Weekly Insight */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">AI Insight</span>
              <span className="text-xs text-amber-600">{DEMO_WEEKLY_BRIEFING.week}</span>
            </div>
            <p className="text-amber-800 text-sm leading-relaxed">{DEMO_WEEKLY_BRIEFING.ai_insight}</p>
          </div>

          {/* Weekly Goal */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">Weekly Goal Progress</h3>
              <span className="text-sm font-bold text-indigo-600">{DEMO_KPI.weekly_goal_pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${DEMO_KPI.weekly_goal_pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{DEMO_WEEKLY_BRIEFING.weekly_goal}</p>
          </div>
        </div>

        {/* RIGHT — 1/3 Activity Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Activity Timeline</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[600px]">
            {timelineItems.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 leading-snug">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{item.detail}</div>
                  <div className="text-xs text-gray-300 mt-0.5">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
