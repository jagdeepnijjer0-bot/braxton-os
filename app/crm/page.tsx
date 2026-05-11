const contacts = [
  { id: 1, name: "Alice Johnson", company: "Acme Corp", role: "VP of Sales", email: "alice@acme.com", phone: "+1 555-0101", status: "Customer", lastContact: "Today" },
  { id: 2, name: "Bob Martinez", company: "Globex Inc", role: "CEO", email: "bob@globex.com", phone: "+1 555-0102", status: "Prospect", lastContact: "Yesterday" },
  { id: 3, name: "Carol Lee", company: "Initech", role: "CTO", email: "carol@initech.com", phone: "+1 555-0103", status: "Customer", lastContact: "May 9" },
  { id: 4, name: "David Park", company: "Umbrella Ltd", role: "Head of Marketing", email: "david@umbrella.com", phone: "+1 555-0104", status: "Lead", lastContact: "May 8" },
  { id: 5, name: "Elena Torres", company: "Hooli", role: "Product Manager", email: "elena@hooli.com", phone: "+1 555-0105", status: "Prospect", lastContact: "May 7" },
  { id: 6, name: "Frank Wright", company: "Pied Piper", role: "Founder", email: "frank@piedpiper.com", phone: "+1 555-0106", status: "Lead", lastContact: "May 6" },
  { id: 7, name: "Grace Kim", company: "Aviato", role: "Director of BD", email: "grace@aviato.com", phone: "+1 555-0107", status: "Customer", lastContact: "May 5" },
  { id: 8, name: "Henry Obi", company: "Raviga Capital", role: "Partner", email: "henry@raviga.com", phone: "+1 555-0108", status: "Prospect", lastContact: "May 4" },
];

const statusBadge: Record<string, string> = {
  Customer: "bg-green-100 text-green-700",
  Prospect: "bg-blue-100 text-blue-700",
  Lead: "bg-yellow-100 text-yellow-700",
  Churned: "bg-red-100 text-red-700",
};

export default function CRMPage() {
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex gap-2">
          {["All", "Customers", "Prospects", "Leads"].map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "All"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Contact
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Contacts", value: "214" },
          { label: "Customers", value: "87" },
          { label: "Prospects", value: "65" },
          { label: "Leads", value: "62" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contacts table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Contacts</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="10" y2="18" /></svg>
              Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></svg>
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Last Contact</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{c.company}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{c.role}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{c.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">{c.lastContact}</td>
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
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 8 of 214 contacts</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-xs">Previous</button>
            <button className="px-3 py-1 rounded border border-gray-200 bg-indigo-600 text-white text-xs">1</button>
            <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-xs">2</button>
            <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-xs">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
