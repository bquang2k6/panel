import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-background/60 backdrop-blur-[2px]">
      {/* Skeleton */}
      <div className="space-y-6 p-6">
        <div className="h-8 w-1/3 animate-pulse rounded-md bg-muted" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-xl bg-muted" />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>

      {/* Loader */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-background/90 px-6 py-5 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    </div>
  );
}