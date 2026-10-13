import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/**
 * Positioning wrapper. Mirrors the gluestack-ui `Input` primitive so affixes
 * (e.g. a password visibility toggle) can be placed relative to the field.
 */
export function Input({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("relative w-full", className)} {...props} />;
}

export interface InputFieldProps extends ComponentProps<"input"> {
  isInvalid?: boolean;
}

export function InputField({
  className,
  isInvalid = false,
  ...props
}: InputFieldProps) {
  return (
    <input
      aria-invalid={isInvalid || undefined}
      className={cn(
        "h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition",
        "placeholder:text-slate-400",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
        isInvalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/40"
          : "border-slate-300 dark:border-slate-700",
        className,
      )}
      {...props}
    />
  );
}
