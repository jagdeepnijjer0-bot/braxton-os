import { getContactStatus } from "@/lib/constants/crm";

export default function StatusBadge({ value }: { value: string | null }) {
  const status = getContactStatus(value);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${status.color}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {status.label}
    </span>
  );
}
