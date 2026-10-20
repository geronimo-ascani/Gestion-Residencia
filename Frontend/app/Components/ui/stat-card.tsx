import { cn } from "../../lib/cn";
import { Progress, type ProgressTone } from "./progress";
import { Icon, type IconName } from "./icons";

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
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            "bg-brand-600 text-white",
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
