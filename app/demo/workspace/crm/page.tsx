"use client";

import { useState } from "react";
import { DEMO_CONTACTS } from "@/lib/demo/seed";

const AI_SCORE_BADGE: Record<string, string> = {
  hot:  "bg-red-50 border border-red-200 text-red-600",
  warm: "bg-orange-50 border border-orange-200 text-orange-600",
  cold: "bg-blue-50 border border-blue-200 text-blue-500",
};

const AI_SCORE_ICON: Record<string, string> = {
  hot:  "🔥",
  warm: "🌡️",
  cold: "❄️",
};

const STATUS_BADGE: Record<string, string> = {
  lead:          "bg-gray-100 text-gray-500",
  new:           "bg-blue-50 text-blue-600 border border-blue-200",
  contacted:     "bg-yellow-50 text-yellow-600 border border-yellow-200",
  qualified:     "bg-indigo-50 text-indigo-600 border border-indigo-200",
  proposal_sent: "bg-purple-50 text-purple-600 border border-purple-200",
  negotiating:   "bg-orange-50 text-orange-600 border border-orange-200",
  closed_won:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  closed_lost:   "bg-red-50 text-red-600 border border-red-200",
};

const LEAD_TYPE_LABELS: Record<string, string> = {
  landlord:               "Landlord",
  investor:               "Investor",
  maintenance_client:     "Maintenance",
  website_app_prospect:   "Website/App",
  ai_automation_prospect: "AI Automation",
};

type Contact = typeof DEMO_CONTACTS[number];

export default function CRMPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? DEMO_CONTACTS.find(c => c.id === selectedId) ?? null : null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM — Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">{DEMO_CONTACTS.length} contacts</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        Track prospects, clients, investors, landlords and business contacts from first enquiry to closed opportunity.
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-3" : ""}`}>
        {/* Contact table */}
        <div className={selected ? "lg:col-span-2" : ""}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Score</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Bottleneck</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Last Activity</th>
                    <th className="px-5 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {DEMO_CONTACTS.map(c => (
                    <tr
                      key={c.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedId === c.id ? "bg-indigo-50" : ""}`}
                      onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.company}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {LEAD_TYPE_LABELS[c.lead_type] ?? c.lead_type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AI_SCORE_BADGE[c.ai_score]}`}>
                          {AI_SCORE_ICON[c.ai_score]} {c.ai_score.charAt(0).toUpperCase() + c.ai_score.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px]"><span className="block truncate">{c.bottleneck}</span></td>
                      <td className="px-5 py-3 text-xs text-gray-400">{c.last_activity}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(selectedId === c.id ? null : c.id); }}
                          className="text-indigo-600 hover:text-indigo-500 text-xs font-medium"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <ContactDetail
            contact={selected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function ContactDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{contact.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{contact.company}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none px-2">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Contact info */}
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 w-16 shrink-0 text-xs">Email</span>
            <span className="text-gray-700 text-xs">{contact.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-16 shrink-0 text-xs">Phone</span>
            <span className="text-gray-700 text-xs">{contact.phone}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-16 shrink-0 text-xs">Source</span>
            <span className="text-gray-700 text-xs">{contact.source.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* AI score + rank */}
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AI_SCORE_BADGE[contact.ai_score]}`}>
            {AI_SCORE_ICON[contact.ai_score]} {contact.ai_score.charAt(0).toUpperCase() + contact.ai_score.slice(1)} lead
          </span>
          <span className="text-xs text-gray-400">Rank #{contact.ai_rank} of {DEMO_CONTACTS.length}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[contact.status] ?? "bg-gray-100 text-gray-500"}`}>
            {contact.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Pain point */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bottleneck</div>
          <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{contact.bottleneck}</div>
        </div>

        {/* Notes */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</div>
          <p className="text-sm text-gray-700 leading-relaxed">{contact.notes}</p>
        </div>

        {/* Activity log */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Activity</div>
          <div className="space-y-2">
            {contact.activity_log.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-700">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">Potential value</span>
          <span className="font-semibold text-gray-900">{contact.value}</span>
        </div>

        {/* Demo action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 rounded-lg transition-colors">
            Book a call
          </button>
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium py-2.5 rounded-lg transition-colors">
            Send message
          </button>
        </div>
      </div>
    </div>
  );
}
