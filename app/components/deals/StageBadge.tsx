import { getDealStage } from "@/lib/constants/deals";

export default function StageBadge({ value }: { value: string | null }) {
  const s = getDealStage(value);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
