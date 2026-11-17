import { cn } from "../../lib/cn";
import { Icon } from "./icons";

export function SearchField({
  value,
  onChange,
  placeholder = "Buscar…",
  label = "Buscar",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          "h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 outline-none transition",
          "placeholder:text-slate-400",
          "focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
        )}
      />
    </div>
  );
}
