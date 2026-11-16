import { StudentClaims, StudentClaimForm, StudentClaimDetail } from "./student-claims";
import type { ReactNode } from "react";
import { Link, Navigate, useParams, useSearchParams, useLocation } from "react-router";
import { STUDENT_NAV } from "../config/student-navigation";
import { datosPortalAlumno } from "../lib/portal-alumno";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";
import { StudentContracts } from "./student-contracts";
import { StudentFines, StudentFineDetail } from "./student-fines";
import { StudentProfile } from "./student-profile";
import { StudentBilling, StudentInvoiceDetail } from "./student-billing";
import { StudentNotices } from "./student-notices";
import { AvisosAlumno } from "./avisos-alumno";
import { InicioAlumno } from "./inicio-alumno";
import { CambiarClave } from "./cambiar-clave";
import { StudentPageHeader, studentLink } from "./student-ui";
import { EmptyState } from "./ui/empty-state";
import type { IconName } from "./ui/icons";

const presentacion: Record<string, { description: string; icon: IconName }> = {
  reclamos: { description: "Realizá tus reclamos y solicitudes, informá problemas y consultá su seguimiento.", icon: "contracts" },
  contratos: { description: "Tu estadía actual y el historial de todos tus años en la residencia.", icon: "contracts" },
  facturas: { description: "Tus facturas, vencimientos y pagos. Toda tu cuenta, en un solo lugar.", icon: "payments" },
  multas: { description: "Consultá tus sanciones, revisá su estado y accedé al detalle de cada una.", icon: "fines" },
  avisos: { description: "Las novedades de tu cuenta y los pendientes que necesitan tu atención.", icon: "bell" },
  perfil: { description: "Tus datos personales, tu información académica y las personas que te acompañan.", icon: "user" },
  "cambiar-clave": { description: "Actualizá tu contraseña para mantener tu cuenta protegida.", icon: "settings" },
  "detalle-factura": { description: "Consultá los conceptos facturados, el saldo y los pagos de este período.", icon: "contracts" },
  "detalle-multa": { description: "Toda la información de esta sanción: motivo, fechas, importes y estado.", icon: "fines" },
};

export function PortalAlumno() {
  const data = useData();
  const { seccion = "inicio", idFactura, idMulta, idReclamo } = useParams();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const nuevoReclamo = pathname === "/estudiante/reclamos/nuevo";
  const p = datosPortalAlumno(data, usuarioActual);
  const cuenta = data.usuarios.find((u) => u.idUsuario === usuarioActual.idUsuario);
  if (seccion === "habitacion" || seccion === "limpieza") return <Navigate to={`/estudiante#${seccion}`} replace />;
  if (!p.alumno) return <EmptyState icon="user" title="Tu cuenta no tiene un alumno asociado" description="Contactá a la administración para vincular tu legajo." />;
  const a = p.alumno;
  const titulo = nuevoReclamo ? "Nueva presentación" : idReclamo ? "Detalle de presentación" : seccion === "reclamos" ? "Reclamos y solicitudes" : idMulta ? "Detalle de multa" : seccion === "cambiar-clave" ? "Cambiar contraseña" : idFactura ? "Detalle de factura" : STUDENT_NAV.find((item) => item.to === `/estudiante/${seccion}`)?.label ?? (seccion === "inicio" ? "Inicio" : "Página no encontrada");
  const estilo = presentacion[nuevoReclamo || idReclamo ? "reclamos" : idMulta ? "detalle-multa" : idFactura ? "detalle-factura" : seccion] ?? { description: "Información de tu cuenta en la residencia.", icon: "building" };
  let contenido: ReactNode;
  if (nuevoReclamo) {
    contenido = <StudentClaimForm />;
  } else if (idReclamo) {
    contenido = <StudentClaimDetail key={idReclamo} id={idReclamo} />;
  } else if (idMulta) {
    const multa = p.multas.find((m) => m.idMulta === idMulta);
    const estado = searchParams.get("estado");
    const volver = `/estudiante/multas${estado && ["pendiente", "pagada", "anulada"].includes(estado) ? `?estado=${estado}` : ""}`;
    contenido = <><Link className={studentLink} to={volver}>← Volver a mis multas</Link>{multa ? <StudentFineDetail multa={multa} facturas={p.facturas} /> : <EmptyState icon="fines" title="Multa no disponible" description="La multa no existe o no pertenece a tu cuenta." />}</>;
  } else if (idFactura) {
    const factura = p.facturas.find((f) => f.idFactura === idFactura);
    contenido = <><Link className={studentLink} to="/estudiante/facturas">← Volver a facturas y pagos</Link>{factura ? <StudentInvoiceDetail factura={factura} pagos={p.pagos} /> : <EmptyState icon="contracts" title="Factura no disponible" description="La factura no existe o no pertenece a tu cuenta." />}</>;
  } else switch (seccion) {
    case "inicio": contenido = <InicioAlumno portal={p} avisos={<AvisosAlumno avisos={p.avisos} />} />; break;
    case "reclamos": contenido = <StudentClaims />; break;
    case "contratos": contenido = <StudentContracts contratos={p.contratos} alumno={a} />; break;
    case "facturas": contenido = <StudentBilling portal={p} />; break;
    case "multas": contenido = <StudentFines multas={p.multas} facturas={p.facturas} />; break;
    case "avisos": contenido = <StudentNotices avisos={p.avisos} />; break;
    case "perfil": contenido = <StudentProfile alumno={a} cuenta={cuenta ?? usuarioActual} />; break;
    case "cambiar-clave": contenido = <><Link to="/estudiante/perfil" className={studentLink}>← Volver a mi perfil</Link><CambiarClave portal /></>; break;
    default: contenido = <EmptyState title="Pantalla no encontrada" action={<Link className={studentLink} to="/estudiante">Volver al panel</Link>} />;
  }
  const esInicio = !idFactura && !idMulta && !idReclamo && !nuevoReclamo && seccion === "inicio";
  const centrado = idReclamo || nuevoReclamo || idMulta || idFactura || seccion === "cambiar-clave";
  return <div className={centrado ? "mx-auto w-full max-w-3xl space-y-7" : "space-y-7"}>{!esInicio ? <StudentPageHeader title={titulo} description={estilo.description} icon={estilo.icon} /> : null}{contenido}</div>;
}
