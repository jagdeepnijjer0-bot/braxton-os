import { getCategory } from "@/lib/constants/finance";

export default function CategoryBadge({ value }: { value: string | null }) {
  const c = getCategory(value);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}
