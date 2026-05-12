"use client";

import { monthLabel } from "@/lib/constants/finance";

interface MonthData {
  month: string;   // "YYYY-MM"
  income: number;
  expenses: number;
  net: number;
}

interface Props {
  data: MonthData[];
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000)     return `£${(n / 1_000).toFixed(0)}k`;
  return `£${Math.round(n)}`;
}

export default function MonthlyChart({ data }: Props) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data yet</div>;
  }

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1);
  const BAR_W  = 20;
  const GAP    = 4;
  const GROUP  = BAR_W * 2 + GAP + 12;
  const H      = 120;
  const LABEL_H = 20;
  const totalW = data.length * GROUP;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${H + LABEL_H}`}
        className="w-full"
        style={{ minWidth: `${Math.max(totalW, 320)}px`, height: `${H + LABEL_H + 4}px` }}
        aria-label="Monthly income vs expenses chart"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = H - pct * H;
          return (
            <line key={pct} x1={0} y1={y} x2={totalW} y2={y}
              stroke="#f1f5f9" strokeWidth="1" />
          );
        })}

        {data.map((d, i) => {
          const x      = i * GROUP;
          const incH   = (d.income / maxVal) * H;
          const expH   = (d.expenses / maxVal) * H;
          const incY   = H - incH;
          const expY   = H - expH;
          const labelX = x + BAR_W + GAP / 2;

          return (
            <g key={d.month}>
              {/* Income bar */}
              <rect x={x} y={incY} width={BAR_W} height={incH}
                fill="#10b981" rx="3" className="cursor-pointer">
                <title>Income {monthLabel(d.month)}: £{d.income.toLocaleString("en-GB")}</title>
              </rect>

              {/* Expense bar */}
              <rect x={x + BAR_W + GAP} y={expY} width={BAR_W} height={expH}
                fill="#f87171" rx="3" className="cursor-pointer">
                <title>Expenses {monthLabel(d.month)}: £{d.expenses.toLocaleString("en-GB")}</title>
              </rect>

              {/* Month label */}
              <text x={labelX} y={H + LABEL_H - 4}
                textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="inherit">
                {monthLabel(d.month)}
              </text>

              {/* Net indicator dot */}
              {(d.income > 0 || d.expenses > 0) && (
                <circle cx={labelX} cy={H - ((d.income - d.expenses) / maxVal) * H}
                  r="2.5" fill={d.net >= 0 ? "#6366f1" : "#f59e0b"} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 flex-shrink-0" />
          Income
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-red-400 flex-shrink-0" />
          Expenses
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
          Net profit
        </div>
      </div>
    </div>
  );
}
