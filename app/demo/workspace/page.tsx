import Link from "next/link";
import { DEMO_KPI, DEMO_AUTOMATION_FEED } from "@/lib/demo/seed";

export const metadata = { title: "Dashboard — Braxton OS Demo" };

const KPI_CARDS = [
  { label: "Active Leads",      value: DEMO_KPI.active_leads,     icon: "👥", color: "indigo" },
  { label: "Open Deals",        value: DEMO_KPI.open_deals,       icon: "💼", color: "emerald" },
  { label: "Pipeline Value",    value: DEMO_KPI.total_pipeline,   icon: "📈", color: "blue" },
  { label: "Tasks Due Today",   value: DEMO_KPI.tasks_due_today,  icon: "✅", color: "orange" },
  { label: "Unread Messages",   value: DEMO_KPI.inbox_unread,     icon: "📬", color: "purple" },
  { label: "Monthly Revenue",   value: DEMO_KPI.monthly_revenue,  icon: "💰", color: "emerald" },
  { label: "Conversion Rate",   value: DEMO_KPI.conversion_rate,  icon: "🎯", color: "indigo" },
  { label: "Avg Deal (days)",   value: DEMO_KPI.avg_deal_days,    icon: "📅", color: "blue" },
];

const colorMap: Record<string, string> = {
  indigo:  "bg-indigo-900/30 border-indigo-700/40 text-indigo-300",
  emerald: "bg-emerald-900/30 border-emerald-700/40 text-emerald-300",
  blue:    "bg-blue-900/30 border-blue-700/40 text-blue-300",
  orange:  "bg-orange-900/30 border-orange-700/40 text-orange-300",
  purple:  "bg-purple-900/30 border-purple-700/40 text-purple-300",
};

const MODULE_CARDS = [
  {
    href: "/demo/workspace/crm",
    icon: "👥",
    title: "CRM",
    desc: "5 active contacts — 1 hot lead, 2 in proposal stage",
    cta: "View contacts →",
  },
  {
    href: "/demo/workspace/inbox",
    icon: "📬",
    title: "Inbox",
    desc: "3 conversations open — 2 unread, 1 urgent maintenance request",
    cta: "Open inbox →",
  },
  {
    href: "/demo/workspace/tasks",
    icon: "✅",
    title: "Tasks",
    desc: "5 tasks — 3 due this week, 1 completed, 1 urgent",
    cta: "Manage tasks →",
  },
  {
    href: "/demo/workspace/automations",
    icon: "⚡",
    title: "Automations",
    desc: "5 recent events fired — leads scored, tasks auto-created",
    cta: "View activity →",
  },
];

export default function DemoWorkspaceDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Demo context card */}
      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl px-5 py-4">
        <p className="text-indigo-300 text-sm">
          <strong>This is your live demo workspace.</strong> Everything you see is representative
          seed data — not real client information. Explore freely, then{" "}
          <Link href="/demo/workspace/reserve" className="underline hover:text-indigo-200">
            reserve your package
          </Link>{" "}
          when you&apos;re ready.
        </p>
      </div>

      {/* KPI grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Business at a glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KPI_CARDS.map(k => (
            <div
              key={k.label}
              className={`border rounded-xl p-4 ${colorMap[k.color]}`}
            >
              <div className="text-2xl mb-1">{k.icon}</div>
              <div className="text-2xl font-black text-white">{k.value}</div>
              <div className="text-xs mt-1 opacity-80">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Module cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Explore your OS</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {MODULE_CARDS.map(m => (
            <Link
              key={m.href}
              href={m.href}
              className="bg-gray-900 border border-gray-800 hover:border-indigo-700/50 rounded-xl p-5 transition-colors group"
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{m.title}</div>
              <div className="text-gray-400 text-sm mb-3">{m.desc}</div>
              <div className="text-indigo-400 text-sm font-medium">{m.cta}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Automation feed */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent automation activity</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {DEMO_AUTOMATION_FEED.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-sm text-gray-200">{a.label}</span>
                <span className="text-xs text-gray-500 hidden sm:block">{a.event}</span>
              </div>
              <span className="text-xs text-gray-500">{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-white text-lg mb-1">Like what you see?</div>
          <div className="text-gray-400 text-sm">Reserve your build slot and we&apos;ll have your OS live within 2 weeks.</div>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/demo/workspace/reserve"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Reserve package →
          </Link>
        </div>
      </div>
    </div>
  );
}
