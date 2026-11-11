import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { InputField } from "./input";

export function ListSummary({ title, description, icon, items }: {
  title: string;
  description: string;
  icon: IconName;
  items: { label: string; value: number | string }[];
}) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-xl border border-brand-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-brand-200 bg-brand-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
        <Icon name={icon} className="h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 px-5 py-5 sm:grid-cols-4">
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums text-brand-900 dark:text-brand-200">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ListToolbar({ title, count, search, onSearch, placeholder, searchLabel, children }: {
  title: string;
  count: number;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">{count} resultados</p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <InputField value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} aria-label={searchLabel} className="pl-9" />
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
