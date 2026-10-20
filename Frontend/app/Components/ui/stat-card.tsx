import { cn } from "../../lib/cn";
import { Progress, type ProgressTone } from "./progress";
import { Icon, type IconName } from "./icons";

const tones: Record<ProgressTone, string> = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  neutral:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  progress,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  tone?: ProgressTone;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          )}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {progress !== undefined ? (
        <Progress value={progress} tone={tone} className="mt-3" />
      ) : null}
    </div>
  );
}
