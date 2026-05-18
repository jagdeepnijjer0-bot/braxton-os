"use client";

interface Props {
  score:       number | null;
  label:       "hot" | "warm" | "cold" | null;
  scoredAt?:   string | null;
  compact?:    boolean;
}

const LABEL_STYLES: Record<"hot" | "warm" | "cold", { badge: string; dot: string; text: string }> = {
  hot:  { badge: "bg-red-50 border-red-200 text-red-700",     dot: "bg-red-500",    text: "Hot" },
  warm: { badge: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400", text: "Warm" },
  cold: { badge: "bg-blue-50 border-blue-200 text-blue-700",  dot: "bg-blue-400",   text: "Cold" },
};

export default function AiScoreBadge({ score, label, scoredAt, compact = false }: Props) {
  if (!label) return null;
  const s = LABEL_STYLES[label];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.text} {score !== null ? `· ${score}` : ""}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${s.badge}`}>
      <span className={`w-2 h-2 rounded-full animate-pulse ${s.dot}`} />
      AI Score: {score} — {s.text}
      {scoredAt && (
        <span className="text-xs font-normal opacity-60 ml-1">
          ({new Date(scoredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })})
        </span>
      )}
    </div>
  );
}
