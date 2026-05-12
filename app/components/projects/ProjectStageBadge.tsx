import { getProjectStage } from "@/lib/constants/projects";

export default function ProjectStageBadge({ value }: { value: string | null }) {
  const s = getProjectStage(value);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
