import { Navigate, useParams } from "react-router";
import { AdminClaims, AdminClaimDetail } from "../Components/admin-claims";
import { usuarioActual } from "../lib/session";

export function meta() { return [{ title: "Reclamos · Administración" }]; }
export default function ReclamosAdministracion() {
  const { idReclamo } = useParams();
  if (usuarioActual.rol !== "administrador") return <Navigate to="/estudiante" replace />;
  return idReclamo ? <AdminClaimDetail key={idReclamo} id={idReclamo} /> : <AdminClaims />;
}
