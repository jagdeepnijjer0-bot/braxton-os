// Skeleton loader primitives — use these to match the shape of real content

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// Base pulse block
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-100",
        className,
      )}
    />
  );
}

// Full table row skeleton (mirrors CRM / deal / task list columns)
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  const widths = ["w-2/5", "w-1/5", "w-1/5", "w-1/6", "w-1/6", "w-10"];
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
      {/* Avatar */}
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      {/* Columns */}
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`${widths[i] ?? "w-1/6"} space-y-1.5`}>
          <Skeleton className="h-3.5 w-full" />
          {i === 0 && <Skeleton className="h-2.5 w-3/5" />}
        </div>
      ))}
    </div>
  );
}

// Skeleton for a stat card
export function SkeletonStatCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-2.5 w-2/3" />
    </div>
  );
}

// Skeleton for a detail panel card
export function SkeletonCard({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
      <Skeleton className="h-3 w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-3 w-16 flex-shrink-0" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for a timeline activity feed
export function SkeletonTimeline({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
