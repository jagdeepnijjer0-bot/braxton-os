const columns = [
  {
    id: "discovery",
    label: "Discovery",
    color: "bg-blue-500",
    deals: [
      { id: 1, name: "Umbrella Ltd", contact: "David Park", value: "$8,500", days: 3, priority: "Medium" },
      { id: 2, name: "Stark Industries", contact: "Pepper Potts", value: "$45,000", days: 7, priority: "High" },
      { id: 3, name: "Wayne Enterprises", contact: "Lucius Fox", value: "$120,000", days: 1, priority: "High" },
    ],
  },
  {
    id: "proposal",
    label: "Proposal",
    color: "bg-yellow-500",
    deals: [
      { id: 4, name: "Acme Corp", contact: "Alice Johnson", value: "$24,000", days: 12, priority: "High" },
      { id: 5, name: "Hooli", contact: "Elena Torres", value: "$31,000", days: 5, priority: "Medium" },
    ],
  },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "bg-orange-500",
    deals: [
      { id: 6, name: "Globex Inc", contact: "Bob Martinez", value: "$57,500", days: 20, priority: "High" },
      { id: 7, name: "Initech", contact: "Bill Lumbergh", value: "$19,000", days: 15, priority: "Low" },
    ],
  },
  {
    id: "closed_won",
    label: "Closed Won",
    color: "bg-green-500",
    deals: [
      { id: 8, name: "Pied Piper", contact: "Frank Wright", value: "$12,000", days: 45, priority: "Medium" },
      { id: 9, name: "Aviato", contact: "Grace Kim", value: "$9,500", days: 30, priority: "Low" },
    ],
  },
  {
    id: "closed_lost",
    label: "Closed Lost",
    color: "bg-red-400",
    deals: [
      { id: 10, name: "Raviga Capital", contact: "Henry Obi", value: "$200,000", days: 60, priority: "High" },
    ],
  },
];

const priorityBadge: Record<string, string> = {
  High: "bg-red-100 text-red-600",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-500",
};

const totalValue = columns
  .filter((c) => c.id !== "closed_lost")
  .flatMap((c) => c.deals)
  .reduce((sum, d) => sum + parseInt(d.value.replace(/[$,]/g, "")), 0);

export default function DealTrackerPage() {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Pipeline Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${(totalValue / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Open Deals</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">9</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Avg Deal Size</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$36K</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Win Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">67%</p>
        </div>
      </div>

      {/* Add deal */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Deal
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {col.deals.length}
              </span>
            </div>

            {/* Deal cards */}
            <div className="space-y-3">
              {col.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{deal.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityBadge[deal.priority]}`}>
                      {deal.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{deal.contact}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{deal.value}</span>
                    <span className="text-xs text-gray-400">{deal.days}d ago</span>
                  </div>
                </div>
              ))}

              {/* Add card placeholder */}
              <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                + Add deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
