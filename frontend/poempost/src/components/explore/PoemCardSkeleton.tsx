"use client";

/** Shimmer skeleton card — matches PoemFeedCard dimensions so layout doesn't jump. */
export function PoemCardSkeleton() {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-white/10 p-6 flex flex-col gap-4 animate-pulse">
      {/* Title */}
      <div className="h-5 w-3/4 rounded-md bg-neutral-700" />

      {/* Author + date */}
      <div className="flex flex-col gap-2">
        <div className="h-3 w-1/2 rounded-md bg-neutral-800" />
        <div className="h-3 w-1/3 rounded-md bg-neutral-800" />
      </div>

      {/* Content block */}
      <div className="flex-1 space-y-2 pt-2">
        <div className="h-3 w-full rounded-md bg-neutral-800" />
        <div className="h-3 w-5/6 rounded-md bg-neutral-800" />
        <div className="h-3 w-4/6 rounded-md bg-neutral-800" />
        <div className="h-3 w-5/6 rounded-md bg-neutral-800" />
      </div>

      {/* Like button placeholder */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-8 w-16 rounded-lg bg-neutral-800" />
        <div className="h-3 w-16 rounded-md bg-neutral-800" />
      </div>
    </div>
  );
}
