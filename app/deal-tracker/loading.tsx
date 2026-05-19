import { Skeleton, SkeletonTableRow } from "@/app/components/ui/Skeleton";

export default function DealTrackerLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      {/* Pipeline stage columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-64 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
