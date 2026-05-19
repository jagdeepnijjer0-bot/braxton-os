import { Skeleton, SkeletonCard } from "@/app/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 pb-px">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-t-lg" />
        ))}
      </div>
      {/* Content panels */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} rows={4} />
      ))}
    </div>
  );
}
