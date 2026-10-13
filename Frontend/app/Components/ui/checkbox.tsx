import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FormControlError } from "./form-control";

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  id: string;
  label: ReactNode;
  error?: string;
}

export function Checkbox({
  id,
  label,
  error,
  className,
  ...props
}: CheckboxProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn("mt-0.5 h-4 w-4 accent-brand-600", className)}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? <FormControlError id={errorId}>{error}</FormControlError> : null}
    </div>
  );
}
