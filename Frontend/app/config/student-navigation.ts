import type { IconName } from "../Components/ui/icons";

export const STUDENT_NAV = [
  { to: "/estudiante", label: "Panel", icon: "dashboard" },
  { to: "/estudiante/contratos", label: "Mis contratos", icon: "contracts" },
  { to: "/estudiante/facturas", label: "Facturas y pagos", icon: "payments" },
  { to: "/estudiante/multas", label: "Mis multas", icon: "fines" },
  { to: "/estudiante/reclamos", label: "Reclamos", icon: "contracts" },
  { to: "/estudiante/avisos", label: "Avisos", icon: "bell" },
  { to: "/estudiante/perfil", label: "Mi perfil", icon: "user" },
] satisfies { to: string; label: string; icon: IconName }[];
