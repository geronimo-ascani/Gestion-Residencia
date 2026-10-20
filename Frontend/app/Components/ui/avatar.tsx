import { cn } from "../../lib/cn";
import { iniciales } from "../../lib/format";

export type AvatarSize = "sm" | "md" | "lg";

const sizes: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  nombre,
  apellido,
  size = "md",
  className,
}: {
  nombre: string;
  apellido?: string;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
        "dark:bg-brand-900/50 dark:text-brand-200",
        sizes[size],
        className,
      )}
    >
      {iniciales(nombre, apellido)}
    </span>
  );
}
