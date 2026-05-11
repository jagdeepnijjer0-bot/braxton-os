const campaigns = [
  {
    id: 1,
    name: "Q2 SaaS Decision Makers",
    status: "Active",
    sent: 320,
    opened: 184,
    replied: 42,
    meetings: 11,
    startDate: "Apr 28",
    endDate: "May 28",
  },
  {
    id: 2,
    name: "Enterprise Accounts Re-engagement",
    status: "Active",
    sent: 95,
    opened: 61,
    replied: 18,
    meetings: 5,
    startDate: "May 1",
    endDate: "Jun 1",
  },
  {
    id: 3,
    name: "Product Launch — Series B Founders",
    status: "Paused",
    sent: 210,
    opened: 130,
    replied: 27,
    meetings: 8,
    startDate: "Mar 15",
    endDate: "May 15",
  },
  {
    id: 4,
    name: "Cold Outreach — Healthcare Vertical",
    status: "Draft",
    sent: 0,
    opened: 0,
    replied: 0,
    meetings: 0,
    startDate: "—",
    endDate: "—",
  },
  {
    id: 5,
    name: "Competitor Switchers Campaign",
    status: "Completed",
    sent: 512,
    opened: 289,
    replied: 83,
    meetings: 24,
    startDate: "Feb 1",
    endDate: "Apr 1",
  },
];

const sequences = [
  { id: 1, name: "Initial Outreach", step: 1, type: "Email", delay: "Day 0", status: "Active" },
  { id: 2, name: "Follow-up #1", step: 2, type: "Email", delay: "Day 3", status: "Active" },
  { id: 3, name: "LinkedIn Connect", step: 3, type: "LinkedIn", delay: "Day 5", status: "Active" },
  { id: 4, name: "Follow-up #2", step: 4, type: "Email", delay: "Day 8", status: "Active" },
  { id: 5, name: "Breakup Email", step: 5, type: "Email", delay: "Day 14", status: "Active" },
];

const statusBadge: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-yellow-100 text-yellow-700",
  Draft: "bg-gray-100 text-gray-500",
  Completed: "bg-blue-100 text-blue-700",
};

function pct(a: number, b: number) {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Emails Sent", value: "1,840" },
          { label: "Open Rate", value: "56.2%" },
          { label: "Reply Rate", value: "20.1%" },
          { label: "Meetings Booked", value: "48" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Campaigns</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Campaign
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campaign</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Open %</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reply %</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Meetings</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Duration</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{c.sent.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{pct(c.opened, c.sent)}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{pct(c.replied, c.sent)}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600 hidden lg:table-cell">{c.meetings || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    {c.startDate !== "—" ? `${c.startDate} → ${c.endDate}` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sequence builder preview */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Sequence: Q2 SaaS Decision Makers</h2>
            <p className="text-xs text-gray-500 mt-0.5">5-step email + LinkedIn sequence · 14 days</p>
          </div>
          <button className="px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
            Edit Sequence
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="flex flex-col gap-0">
            {sequences.map((step, i) => (
              <div key={step.id} className="flex items-start gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  {i < sequences.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                  )}
                </div>
                {/* Step details */}
                <div className={`flex-1 pb-6 ${i === sequences.length - 1 ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.name}</p>
                      <p className="text-xs text-gray-500">{step.type} · Send on {step.delay}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {step.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
