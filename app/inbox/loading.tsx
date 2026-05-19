import { Skeleton } from "@/app/components/ui/Skeleton";

function SkeletonConvCard() {
  return (
    <div className="px-4 py-3.5 border-b border-gray-100">
      <div className="flex items-start gap-3 pl-2">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-12 flex-shrink-0" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-full" />
          <div className="flex gap-1.5 mt-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InboxLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation list */}
      <div className="w-80 border-r border-gray-100 bg-white flex-shrink-0 flex flex-col">
        <div className="p-3 border-b border-gray-100 space-y-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-1/3 rounded-xl" />
            <Skeleton className="h-7 w-1/3 rounded-xl" />
            <Skeleton className="h-7 w-1/4 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonConvCard key={i} />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
