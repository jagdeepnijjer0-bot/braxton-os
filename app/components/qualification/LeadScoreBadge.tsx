import type { QualHeat } from "@/lib/supabase/types";
import { HEAT_CONFIG } from "@/lib/constants/qualification";

interface Props {
  heat: QualHeat;
  score: number;
  maxScore?: number;
  size?: "sm" | "md";
}

export default function LeadScoreBadge({ heat, score, maxScore, size = "sm" }: Props) {
  const cfg = HEAT_CONFIG[heat];
  const showPct = maxScore && maxScore > 0;
  const pct = showPct ? Math.round((score / maxScore) * 100) : null;

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} ${size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"}`}>
      <span className={`rounded-full flex-shrink-0 ${cfg.dot} ${size === "md" ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
      {cfg.label}
      {pct !== null && <span className="opacity-70">· {pct}%</span>}
    </span>
  );
}
