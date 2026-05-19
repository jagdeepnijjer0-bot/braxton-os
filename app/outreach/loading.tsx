import { Skeleton, SkeletonTableRow } from "@/app/components/ui/Skeleton";

export default function OutreachLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)}
      </div>
    </div>
  );
}
