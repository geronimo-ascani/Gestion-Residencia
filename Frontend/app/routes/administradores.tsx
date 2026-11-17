import { useState } from "react";

import { Avatar } from "../Components/ui/avatar";
import { Button, ButtonLink } from "../Components/ui/button";
import { CuentaEstado } from "../Components/cuenta-estado";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { puedeGestionarAdministradores } from "../lib/administracion";
import { normalizar } from "../lib/format";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Administradores · Gestión de Residencia" }]; }
export default function Administradores() {
  const datos = useData();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const admins = datos.usuarios.filter((u) => u.rol === "administrador");
  const filas = admins.filter((u) => (!estado || u.estado === estado) && normalizar(`${u.nombre} ${u.correo}`).includes(normalizar(busqueda.trim())));
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Administración" title="Administradores" description="Gestioná los perfiles, los permisos y el acceso del equipo de la residencia." actions={<div className="flex flex-wrap gap-2"><ButtonLink to={`/administracion/administradores/${usuarioActual.idUsuario}`} variant="outline"><Icon name="user" className="h-4 w-4" />Mi perfil</ButtonLink>{puedeGestionarAdministradores(datos) ? <ButtonLink to="/administracion/administradores/nuevo"><Icon name="plus" className="h-4 w-4" />Nuevo administrador</ButtonLink> : null}</div>} />
    <ListSummary title="Equipo de administración" description="Cada integrante tiene su propia cuenta y un historial de las acciones que realiza." icon="users" items={[{ label: "Administradores", value: admins.length }, { label: "Activos", value: admins.filter((u) => u.estado === "activo").length }, { label: "Pendientes de activación", value: admins.filter((u) => u.estado === "pendiente").length }, { label: "Suspendidos / inactivos", value: admins.filter((u) => ["suspendido", "inactivo"].includes(u.estado)).length }]} />
    <ListToolbar title="Administradores registrados" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar por nombre o correo…" searchLabel="Buscar administrador"><SelectField id="estado-admin" label="Estado de la cuenta" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos los estados</option><option value="activo">Activa</option><option value="pendiente">Pendiente de activación</option><option value="suspendido">Suspendida</option><option value="inactivo">Inactiva</option></SelectField>{busqueda || estado ? <Button variant="ghost" onClick={() => { setBusqueda(""); setEstado(""); }}>Limpiar filtros</Button> : null}</ListToolbar>
    <TableWrap><Table><caption className="sr-only">Perfiles y acceso de administradores</caption><THead><TR><TH>Administrador</TH><TH>Permisos</TH><TH>Estado</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{filas.map((u) => <TR key={u.idUsuario}><TD><div className="flex items-center gap-3"><Avatar nombre={u.nombre} size="sm" /><div><p className="font-semibold">{u.nombre}{u.idUsuario === usuarioActual.idUsuario ? " (vos)" : ""}</p><p className="text-sm text-slate-500">{u.correo}</p></div></div></TD><TD>{u.gestionaAdministradores ? "Gestión de residencia y administradores" : "Gestión de residencia"}</TD><TD><CuentaEstado estado={u.estado} /></TD><TD className="text-right"><ButtonLink to={`/administracion/administradores/${u.idUsuario}`} size="sm" variant="outline">Ver perfil<Icon name="arrow" className="h-4 w-4" /></ButtonLink></TD></TR>)}{!filas.length ? <TR><TD colSpan={4}><EmptyState icon="users" title="Sin resultados" description="Probá con otro nombre, correo o estado." /></TD></TR> : null}</TBody></Table></TableWrap>
  </div>;
}
