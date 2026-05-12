import { getInvestorStatus } from "@/lib/constants/deals";

export default function InvestorBadge({ value }: { value: string | null }) {
  const s = getInvestorStatus(value);
  if (s.value === "none") return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      👤 {s.label}
    </span>
  );
}
