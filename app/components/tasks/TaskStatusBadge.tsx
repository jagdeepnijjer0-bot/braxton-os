import { getTaskStatus } from "@/lib/constants/tasks";

export default function TaskStatusBadge({ value, size = "sm" }: { value: string | null; size?: "xs" | "sm" }) {
  const s = getTaskStatus(value);
  const text = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${text} ${s.bg} ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}
