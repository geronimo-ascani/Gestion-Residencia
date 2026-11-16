import type { ReactNode } from "react";
import { Icon, type IconName } from "./ui/icons";

export function StudentDetail({ label, children, icon }: { label: string; children: ReactNode; icon: IconName }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/60">
    <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
    <div className="min-w-0"><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{children ?? "Sin registrar"}</dd></div>
  </div>;
}
