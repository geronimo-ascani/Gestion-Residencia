import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const variants: Record<BadgeVariant, string> = {
  neutral:
    "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  brand:
    "border-brand-200 bg-white text-brand-700 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-200",
  success:
    "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-white text-amber-800 dark:border-amber-900 dark:bg-slate-900 dark:text-amber-300",
  danger:
    "border-red-200 bg-white text-red-700 dark:border-red-900 dark:bg-slate-900 dark:text-red-300",
  info:
    "border-sky-200 bg-white text-sky-800 dark:border-sky-900 dark:bg-slate-900 dark:text-sky-300",
};

const dots: Record<BadgeVariant, string> = {
  neutral: "bg-slate-400",
  brand: "bg-brand-600",
  success: "bg-emerald-600",
  warning: "bg-amber-600",
  danger: "bg-red-600",
  info: "bg-sky-600",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type EstadoBadge =
  | "pagada"
  | "pendiente"
  | "vencida"
  | "anulada"
  | "vigente"
  | "por-vencer"
  | "finalizado"
  | "programado"
  | "activo"
  | "inactivo"
  | "disponible"
  | "vacia"
  | "llena";

const estados: Record<EstadoBadge, { label: string; variant: BadgeVariant }> = {
  pagada: { label: "Pagada", variant: "success" },
  pendiente: { label: "Pendiente", variant: "info" },
  vencida: { label: "Vencida", variant: "danger" },
  anulada: { label: "Anulada", variant: "neutral" },
  vigente: { label: "Vigente", variant: "success" },
  "por-vencer": { label: "Por vencer", variant: "warning" },
  finalizado: { label: "Finalizado", variant: "neutral" },
  programado: { label: "Programado", variant: "info" },
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "neutral" },
  disponible: { label: "Disponible", variant: "success" },
  vacia: { label: "Vacía", variant: "neutral" },
  llena: { label: "Llena", variant: "warning" },
};

export function StatusBadge({ estado }: { estado: EstadoBadge }) {
  const config = estados[estado];
  return (
    <Badge variant={config.variant}>
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", dots[config.variant])}
      />
      {config.label}
    </Badge>
  );
}
