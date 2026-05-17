import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  lead_found:          "Lead Found",
  reviewing:           "Reviewing",
  offer_made:          "Offer Made",
  under_negotiation:   "Negotiation",
  investor_interested: "Investor",
  legals:              "Legals",
  refurb:              "Refurb",
  sold_completed:      "Completed",
};

const STAGE_COLORS: Record<string, string> = {
  lead_found:          "bg-slate-400",
  reviewing:           "bg-sky-400",
  offer_made:          "bg-indigo-400",
  under_negotiation:   "bg-violet-500",
  investor_interested: "bg-amber-400",
  legals:              "bg-orange-400",
  refurb:              "bg-emerald-400",
  sold_completed:      "bg-emerald-600",
};

const STAGE_TEXT: Record<string, string> = {
  lead_found:          "text-slate-600",
  reviewing:           "text-sky-600",
  offer_made:          "text-indigo-600",
  under_negotiation:   "text-violet-600",
  investor_interested: "text-amber-600",
  legals:              "text-orange-600",
  refurb:              "text-emerald-600",
  sold_completed:      "text-emerald-700",
};

interface Props {
  stageCounts: Record<string, number>;
  stageValues: Record<string, number>;
  total: number;
}

export default function PipelineBar({ stageCounts, stageValues, total }: Props) {
  const stages = Object.entries(STAGE_LABELS).filter(([key]) => (stageCounts[key] || 0) > 0);

  if (total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Deal Pipeline</h2>
          <Link href="/deal-tracker" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">No active deals</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Deal Pipeline</h2>
        <Link href="/deal-tracker" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-5">
        {stages.map(([key]) => {
          const pct = total > 0 ? ((stageCounts[key] || 0) / total) * 100 : 0;
          return (
            <div
              key={key}
              className={`${STAGE_COLORS[key]} rounded-full`}
              style={{ width: `${pct}%` }}
              title={`${STAGE_LABELS[key]}: ${stageCounts[key]}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {stages.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STAGE_COLORS[key]}`} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${STAGE_TEXT[key]}`}>{stageCounts[key]}</span>
              {stageValues[key] > 0 && (
                <span className="text-xs text-gray-400">£{(stageValues[key] / 1000).toFixed(0)}k</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
