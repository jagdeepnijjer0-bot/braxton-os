import Link from "next/link";

function fmt(n: number) {
  return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  moneyIn:  number;
  moneyOut: number;
  month:    string;
}

export default function FinanceSummary({ moneyIn, moneyOut, month }: Props) {
  const net    = moneyIn - moneyOut;
  const total  = moneyIn + moneyOut;
  const inPct  = total > 0 ? (moneyIn / total) * 100 : 50;
  const outPct = total > 0 ? (moneyOut / total) * 100 : 50;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Finance</h2>
          <p className="text-xs text-gray-400">{month} · month-to-date</p>
        </div>
        <Link href="/finance" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>
      </div>

      {/* In / Out bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        <div className="bg-emerald-400 rounded-l-full" style={{ width: `${inPct}%` }} />
        <div className="bg-rose-400 rounded-r-full" style={{ width: `${outPct}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-500">In</span>
          </div>
          <div className="text-base font-bold text-emerald-600">{fmt(moneyIn)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-xs text-gray-500">Out</span>
          </div>
          <div className="text-base font-bold text-rose-500">{fmt(moneyOut)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Net</div>
          <div className={`text-base font-bold ${net >= 0 ? "text-gray-900" : "text-rose-600"}`}>
            {fmt(net)}
          </div>
        </div>
      </div>
    </div>
  );
}
