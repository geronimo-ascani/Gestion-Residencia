import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, indice) => (
        <Skeleton
          key={indice}
          className={cn("h-3.5", indice === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
