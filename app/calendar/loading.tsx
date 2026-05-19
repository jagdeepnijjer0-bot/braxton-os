import { Skeleton } from "@/app/components/ui/Skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-2 px-3">
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-gray-100">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-white p-2 space-y-1.5">
              <Skeleton className="h-5 w-5 rounded-full" />
              {i % 5 === 0 && <Skeleton className="h-4 w-full rounded" />}
              {i % 7 === 0 && <Skeleton className="h-4 w-4/5 rounded" />}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 border-l border-gray-100 bg-gray-50/50 flex-shrink-0 hidden lg:flex flex-col p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-2 flex items-start gap-2">
            <Skeleton className="w-6 h-6 rounded flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
        <Skeleton className="h-3 w-24 mt-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
