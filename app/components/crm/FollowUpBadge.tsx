import { formatFollowUpDate } from "@/lib/constants/crm";

export default function FollowUpBadge({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-gray-400">—</span>;

  const formatted = formatFollowUpDate(date);
  const isOverdue = formatted.includes("overdue");
  const isToday   = formatted === "Today";
  const isSoon    = formatted === "Tomorrow" || formatted.startsWith("In");

  const color = isOverdue
    ? "bg-red-100 text-red-700"
    : isToday
    ? "bg-orange-100 text-orange-700"
    : isSoon
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {formatted}
    </span>
  );
}
