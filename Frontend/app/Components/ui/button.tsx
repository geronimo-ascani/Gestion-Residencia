import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "solid" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium " +
  "select-none transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 " +
  "disabled:pointer-events-none disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
  outline:
    "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200/70 " +
    "dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50",
  ghost:
    "text-brand-700 hover:bg-brand-50 hover:text-brand-800 " +
    "dark:text-brand-300 dark:hover:bg-brand-900/30 dark:hover:text-brand-200",
  danger: "bg-red-700 text-white hover:bg-red-800 active:bg-red-900",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "solid",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}
