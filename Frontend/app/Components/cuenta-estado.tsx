import { Badge } from "./ui/badge";
import { ESTADOS_CUENTA } from "../lib/administracion";
export function CuentaEstado({ estado }: { estado: keyof typeof ESTADOS_CUENTA }) {
  return <Badge variant={estado === "activo" ? "success" : estado === "pendiente" ? "warning" : estado === "suspendido" ? "danger" : "neutral"}>{ESTADOS_CUENTA[estado]}</Badge>;
}
