import Link from "next/link";
import { DEMO_CONTACTS } from "@/lib/demo/seed";

export const metadata = { title: "CRM — Braxton OS Demo" };

const STATUS_COLORS: Record<string, string> = {
  lead:          "bg-gray-700 text-gray-300",
  new:           "bg-blue-900/60 text-blue-300",
  contacted:     "bg-yellow-900/60 text-yellow-300",
  qualified:     "bg-indigo-900/60 text-indigo-300",
  proposal_sent: "bg-purple-900/60 text-purple-300",
  negotiating:   "bg-orange-900/60 text-orange-300",
  closed_won:    "bg-emerald-900/60 text-emerald-300",
  closed_lost:   "bg-red-900/60 text-red-300",
  follow_up:     "bg-amber-900/60 text-amber-300",
  demo_user:     "bg-indigo-900/60 text-indigo-300",
};

const LEAD_TYPE_LABELS: Record<string, string> = {
  landlord:              "Landlord",
  investor:              "Investor",
  maintenance_client:    "Maintenance",
  website_app_prospect:  "Website/App",
  ai_automation_prospect: "AI Automation",
};

export default function DemoCRMPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM — Contacts</h1>
          <p className="text-gray-400 text-sm mt-1">
            {DEMO_CONTACTS.length} demo contacts — showing AI scoring, lead types, and status tracking
          </p>
        </div>
        <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-lg border border-gray-700">
          Demo data only
        </div>
      </div>

      {/* Feature callout */}
      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl px-5 py-4 text-sm text-indigo-300">
        <strong>In your real OS:</strong> leads flow in from forms, outreach, and external sources — automatically
        scored by AI and assigned to the right pipeline stage. No manual data entry.
      </div>

      {/* Contact list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wide">
          <span>Contact</span>
          <span className="text-right">Type</span>
          <span className="text-right">Status</span>
          <span className="text-right">Added</span>
        </div>
        {DEMO_CONTACTS.map((c, i) => (
          <div
            key={c.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 ${
              i < DEMO_CONTACTS.length - 1 ? "border-b border-gray-800" : ""
            }`}
          >
            <div>
              <div className="font-medium text-white">{c.name}</div>
              <div className="text-sm text-gray-400">{c.email}</div>
              {c.company && <div className="text-xs text-gray-500">{c.company}</div>}
            </div>
            <div className="text-right">
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                {LEAD_TYPE_LABELS[c.lead_type] ?? c.lead_type}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-700 text-gray-300"}`}>
                {c.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-right text-xs text-gray-500">
              {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </div>
          </div>
        ))}
      </div>

      {/* Notes preview */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Contact notes</h2>
        <div className="space-y-3">
          {DEMO_CONTACTS.filter(c => c.notes).slice(0, 3).map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <div className="font-medium text-white text-sm mb-1">{c.name}</div>
              <div className="text-gray-400 text-sm">{c.notes}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/40 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <span className="font-bold text-white">Your CRM</span> would include your real contacts, deal history, AI lead scores, and automated follow-up queues.
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
