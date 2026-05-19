import { SkeletonStatCard, Skeleton } from "./components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Pipeline + Finance row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      </div>

      {/* Deals + Projects row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <Skeleton className="h-4 w-1/3" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Events + Activity + Notifications row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <Skeleton className="h-4 w-1/3" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
