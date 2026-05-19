import { Skeleton } from "@/app/components/ui/Skeleton";

function SkeletonTaskCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-5 w-12 rounded-full flex-shrink-0" />
      </div>
      <Skeleton className="h-2.5 w-1/2" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export default function TasksLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto p-5">
        <div className="flex gap-4 h-full min-w-max">
          {["To Do", "In Progress", "Overdue", "Completed"].map(col => (
            <div key={col} className="w-72 flex-shrink-0 space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonTaskCard key={i} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
