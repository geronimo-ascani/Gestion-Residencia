import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Icon, type IconName } from "./ui/icons";

export const studentLink = "inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300";

export function StudentPageHeader({ title, description, icon, extra, eyebrow = "Mi residencia · Portal del alumno" }: {
  title: string; description: string; icon: IconName; extra?: ReactNode; eyebrow?: string;
}) {
  return <header className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-7 text-white shadow-lg shadow-brand-900/10 sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-10 -z-10 h-80 w-80 rounded-full border-[40px] border-white/5" />
    <div className="flex items-center justify-between gap-5">
      <div className="min-w-0"><p className="text-[10px] font-semibold tracking-[0.2em] text-brand-100 uppercase">{eyebrow}</p><h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-100">{description}</p>{extra ? <div className="mt-4 text-xs text-brand-100">{extra}</div> : null}</div>
      <span aria-hidden="true" className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 sm:flex"><Icon name={icon} className="h-9 w-9 text-brand-100" /></span>
    </div>
  </header>;
}

export function StudentSection({ title, description, icon, aside, children, flush = false }: {
  title: string; description?: string; icon: IconName; aside?: ReactNode; children: ReactNode; flush?: boolean;
}) {
  return <Card className="overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800">
    <CardHeader className="flex-wrap items-center px-6 py-5"><div className="flex min-w-0 items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"><Icon name={icon} className="h-5 w-5" /></span><div><CardTitle>{title}</CardTitle>{description ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}</div></div>{aside}</CardHeader>
    {flush ? children : <CardContent className="p-6">{children}</CardContent>}
  </Card>;
}

export function StudentMetric({ label, value, description, icon, danger = false }: {
  label: string; value: ReactNode; description?: string; icon: IconName; danger?: boolean;
}) {
  return <Card className={`rounded-2xl p-5 ${danger ? "border-red-200 bg-red-50/80 dark:border-red-900 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-800"}`}>
    <div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-medium ${danger ? "text-red-700 dark:text-red-300" : "text-slate-500"}`}>{label}</p><p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${danger ? "text-red-800 dark:text-red-300" : "text-slate-900 dark:text-white"}`}>{value}</p></div><span className={`rounded-xl p-2.5 ${danger ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"}`}><Icon name={icon} className="h-5 w-5" /></span></div>
    {description ? <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}
  </Card>;
}
