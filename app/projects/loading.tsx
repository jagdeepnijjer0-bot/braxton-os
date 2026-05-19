import { Skeleton } from "@/app/components/ui/Skeleton";

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
