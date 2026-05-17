import Link from "next/link";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "slate";
  icon: React.ReactNode;
  trend?: { value: string; up: boolean } | null;
}

const colorMap: Record<string, string> = {
  indigo:  "bg-indigo-50  text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50   text-amber-600",
  rose:    "bg-rose-50    text-rose-600",
  sky:     "bg-sky-50     text-sky-600",
  violet:  "bg-violet-50  text-violet-600",
  slate:   "bg-slate-100  text-slate-600",
};

export default function KpiCard({ label, value, sub, href, color = "indigo", icon, trend }: Props) {
  const card = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          {icon}
        </span>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? "text-emerald-600" : "text-rose-500"}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {trend.up
              ? <polyline points="18 15 12 9 6 15" />
              : <polyline points="6 9 12 15 18 9" />}
          </svg>
          {trend.value}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
