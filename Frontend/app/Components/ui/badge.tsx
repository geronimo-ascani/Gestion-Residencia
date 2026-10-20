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
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  brand:
    "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

const dots: Record<BadgeVariant, string> = {
  neutral: "bg-slate-400",
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
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
  | "parcial"
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
  parcial: { label: "Parcial", variant: "warning" },
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
