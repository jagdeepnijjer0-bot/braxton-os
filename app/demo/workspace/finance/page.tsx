import { DEMO_FINANCE } from "@/lib/demo/seed";

export const metadata = { title: "Finance — Braxton OS Demo" };

const revenue = DEMO_FINANCE.categories.filter(c => c.type === "revenue");
const expenses = DEMO_FINANCE.categories.filter(c => c.type === "expense");

export default function FinancePage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-500 text-sm mt-1">Business-wide P&amp;L overview</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        Monitor business-wide revenue, expenses, subscriptions, staff costs, software costs, project spend and profitability.
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Revenue",   value: DEMO_FINANCE.summary.revenue,  color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          { label: "Total Expenses",  value: DEMO_FINANCE.summary.expenses, color: "text-red-700 bg-red-50 border-red-200"             },
          { label: "Net Profit",      value: DEMO_FINANCE.summary.net,      color: "text-indigo-700 bg-indigo-50 border-indigo-200"    },
          { label: "Cashflow",        value: DEMO_FINANCE.summary.cashflow, color: "text-blue-700 bg-blue-50 border-blue-200"          },
        ].map(k => (
          <div key={k.label} className={`border rounded-xl p-3 sm:p-4 ${k.color}`}>
            <div className="text-xl sm:text-2xl font-black">{k.value}</div>
            <div className="text-xs mt-1 opacity-80 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue & Expenses breakdown */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50">
            <h2 className="font-semibold text-emerald-800 text-sm">Revenue Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenue.map(cat => (
                  <tr key={cat.name}>
                    <td className="px-5 py-3 text-gray-700">{cat.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">£{cat.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-medium ${cat.trend.startsWith("+") ? "text-emerald-600" : cat.trend === "new" ? "text-indigo-600" : "text-gray-400"}`}>
                        {cat.trend}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 border-t border-emerald-100">
                  <td className="px-5 py-3 font-bold text-emerald-800">Total Revenue</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-800">
                    £{revenue.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-red-50">
            <h2 className="font-semibold text-red-800 text-sm">Expense Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(cat => (
                  <tr key={cat.name}>
                    <td className="px-5 py-3 text-gray-700">{cat.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">£{cat.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-medium ${cat.trend.startsWith("+") ? "text-red-500" : cat.trend.startsWith("-") ? "text-emerald-600" : "text-gray-400"}`}>
                        {cat.trend}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-red-50 border-t border-red-100">
                  <td className="px-5 py-3 font-bold text-red-800">Total Expenses</td>
                  <td className="px-5 py-3 text-right font-bold text-red-800">
                    £{expenses.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Software subscriptions */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Software Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Tool</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DEMO_FINANCE.subscriptions.map(sub => (
                <tr key={sub.name}>
                  <td className="px-5 py-3 text-gray-700 font-medium">{sub.name}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {sub.cost === 0 ? "Free" : `£${sub.cost}`}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 text-xs">{sub.billing}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-5 py-3 font-bold text-gray-700">Total / mo</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">
                  £{DEMO_FINANCE.subscriptions.reduce((s, c) => s + c.cost, 0)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
        <p className="text-sm text-gray-500">
          This shows your full business P&amp;L across all entities in one view. In your real OS, transactions sync from Xero and are categorised automatically.
        </p>
      </div>
    </div>
  );
}
