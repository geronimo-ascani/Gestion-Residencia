import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export function TableWrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm", className)} {...props} />;
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full border-collapse text-left text-sm", className)}
      {...props}
    />
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "border-b border-brand-200 bg-brand-100 text-xs font-semibold text-brand-900 dark:text-slate-400",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn(
        "divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50 [&>tr:hover]:bg-brand-50 dark:divide-slate-800",
        className,
      )}
      {...props}
    />
  );
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
        className,
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 font-medium whitespace-nowrap first:pl-4 last:pr-4",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "px-3 py-3 align-middle first:pl-4 last:pr-4",
        className,
      )}
      {...props}
    />
  );
}
