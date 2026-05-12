import { getLeadType } from "@/lib/constants/crm";

export default function LeadTypeBadge({ value }: { value: string | null }) {
  const type = getLeadType(value);
  if (!type) return <span className="text-xs text-gray-300">—</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${type.color}`}>
      {type.label}
    </span>
  );
}
