import { cn } from "../../lib/cn";

export type ProgressTone =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const tones: Record<ProgressTone, string> = {
  brand: "bg-brand-600",
  success: "bg-emerald-700",
  warning: "bg-amber-600",
  danger: "bg-red-700",
  neutral: "bg-slate-500",
};

export function Progress({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
