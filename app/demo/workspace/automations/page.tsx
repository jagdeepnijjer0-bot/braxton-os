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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Automation Engine</h1>
          <p className="text-gray-400 text-sm mt-1">
            n8n-powered workflows running silently behind your business
          </p>
        </div>
        <div className="bg-emerald-900/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg border border-emerald-700/40 font-semibold">
          {EXAMPLE_WORKFLOWS.filter(w => w.status === "active").length} active
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl px-5 py-4 text-sm text-indigo-300">
        <strong>This is the intelligence layer.</strong> Every event in Braxton OS — a form submission,
        a deal update, an inbound message — can trigger a chain of automated actions.
        No code needed. No tool-switching. Just outcomes.
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Recent activity</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {DEMO_AUTOMATION_FEED.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm text-gray-200">{a.label}</div>
                  <div className="text-xs text-gray-500">{a.event}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                  {a.status}
                </span>
                <span className="text-xs text-gray-500">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Active workflows</h2>
        <div className="space-y-3">
          {EXAMPLE_WORKFLOWS.map((wf, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-white text-sm">{wf.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Trigger: {wf.trigger}</div>
                </div>
                <span className="text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 px-2 py-0.5 rounded-full shrink-0">
                  active
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {wf.actions.map((a, j) => (
                  <span key={j} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                    {j + 1}. {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/40 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <span className="font-bold text-white">Your automation engine</span> would be customised around your exact workflows — built and maintained as part of your OS package.
        </div>
        <Link
          href="/demo/workspace/reserve"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Get yours →
        </Link>
      </div>
    </div>
  );
}
