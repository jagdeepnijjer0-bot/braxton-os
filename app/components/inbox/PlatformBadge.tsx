import { getPlatform } from "@/lib/constants/inbox";

export default function PlatformBadge({ value, size = "sm" }: { value: string | null; size?: "xs" | "sm" }) {
  const p = getPlatform(value);
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${pad} ${p.bg} ${p.color}`}>
      <span>{p.icon}</span>
      {p.label}
    </span>
  );
}
