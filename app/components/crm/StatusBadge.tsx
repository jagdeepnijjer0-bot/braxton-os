import { getContactStatus } from "@/lib/constants/crm";

export default function StatusBadge({ value }: { value: string | null }) {
  const status = getContactStatus(value);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
      {status.label}
    </span>
  );
}
