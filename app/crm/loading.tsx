import { Skeleton, SkeletonTableRow } from "@/app/components/ui/Skeleton";

export default function CRMLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-52 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="border-b border-gray-100 px-5 py-3 flex gap-4">
          {["w-2/5", "w-1/6", "w-1/6", "w-1/6", "w-1/8"].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonTableRow key={i} cols={5} />
        ))}
      </div>
    </div>
  );
}
