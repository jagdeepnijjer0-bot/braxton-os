"use client";

interface Props {
  value: number; // 0–100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  colorClass?: string;
}

export default function ProgressBar({ value, showLabel = true, size = "md", colorClass }: Props) {
  const pct = Math.min(Math.max(Math.round(value), 0), 100);
  const color = colorClass ?? (pct === 100 ? "bg-emerald-500" : pct >= 75 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-gray-400");
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 flex-shrink-0 w-8 text-right">{pct}%</span>
      )}
    </div>
  );
}
