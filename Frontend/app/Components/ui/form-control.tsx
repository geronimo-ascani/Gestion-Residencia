import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export function FormControl({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function FormControlLabel({
  className,
  ...props
}: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-slate-700 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}

export function FormControlError({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      role="alert"
      className={cn("text-sm text-red-600 dark:text-red-400", className)}
      {...props}
    />
  );
}
