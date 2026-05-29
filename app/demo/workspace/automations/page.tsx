import Link from "next/link";
import { DEMO_AUTOMATION_FEED } from "@/lib/demo/seed";

export const metadata = { title: "Automations — Braxton OS Demo" };

const EXAMPLE_WORKFLOWS = [
  {
    name: "New lead → CRM + Task + Notification",
    trigger: "Form submission or outreach reply",
    actions: ["Create/update CRM contact", "Score lead with AI", "Create follow-up task", "Send team notification"],
    status: "active",
  },
  {
    name: "Hot lead alert",
    trigger: "AI score crosses threshold",
    actions: ["Flag contact as hot", "Create urgent task", "Send n8n webhook to sales CRM"],
    status: "active",
  },
  {
    name: "Deal stage change",
    trigger: "Deal moved to Negotiation",
    actions: ["Log CRM activity", "Create proposal task", "Notify account manager"],
    status: "active",
  },
  {
    name: "Overdue follow-up sweep",
    trigger: "Daily cron at 8am",
    actions: ["Find contacts past follow-up date", "Create overdue tasks", "Fire webhook"],
    status: "active",
  },
  {
    name: "Inbound message routing",
    trigger: "New message on any channel",
    actions: ["Match to CRM contact", "Route to correct inbox", "Auto-tag by urgency"],
    status: "active",
  },
];

export default function DemoAutomationsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-gray-500 text-sm mt-1">
            n8n-powered workflows running silently behind your business
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold shrink-0">
          {EXAMPLE_WORKFLOWS.filter(w => w.status === "active").length} active
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-700">
        <strong>This is the intelligence layer.</strong> Every event in Braxton OS — a form submission,
        a deal update, an inbound message — can trigger a chain of automated actions.
        No code needed. No tool-switching. Just outcomes.
      </div>

      {/* Recent activity — dark card is intentional: live automation feed aesthetic */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Recent activity</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {DEMO_AUTOMATION_FEED.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-gray-200 truncate">{a.label}</div>
                  <div className="text-xs text-gray-500 truncate">{a.event}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                  {a.status}
                </span>
                <span className="text-xs text-gray-500 hidden sm:block">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow cards */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Active workflows</h2>
        <div className="space-y-3">
          {EXAMPLE_WORKFLOWS.map((wf, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{wf.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Trigger: {wf.trigger}</div>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  active
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {wf.actions.map((a, j) => (
                  <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                    {j + 1}. {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-indigo-700">
          <span className="font-bold text-indigo-900">Your automation engine</span> would be customised around your exact workflows — built and maintained as part of your OS package.
        </p>
        <Link
          href="/demo/workspace/reserve"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
        >
          Get yours →
        </Link>
      </div>
    </div>
  );
}
