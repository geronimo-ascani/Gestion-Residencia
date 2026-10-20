import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import {
  FormControl,
  FormControlError,
  FormControlLabel,
} from "./form-control";

export interface SelectFieldProps
  extends Omit<ComponentProps<"select">, "id" | "required"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function SelectField({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <FormControl>
      <FormControlLabel htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        ) : null}
      </FormControlLabel>
      <div className="relative">
        <select
          id={id}
          required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full cursor-pointer appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-slate-900 shadow-sm outline-none transition",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            "dark:bg-slate-900 dark:text-slate-100",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/40"
              : "border-slate-300 dark:border-slate-700",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {error ? (
        <FormControlError id={errorId}>{error}</FormControlError>
      ) : hint ? (
        <p id={hintId} className="text-sm text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </FormControl>
  );
}
