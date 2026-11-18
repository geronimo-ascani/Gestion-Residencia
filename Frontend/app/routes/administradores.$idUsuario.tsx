import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { BackToList } from "../Components/ui/back-to-list";
import { CambiarClave } from "../Components/cambiar-clave";
import { useState } from "react";
import { useParams } from "react-router";
import { Avatar } from "../Components/ui/avatar";
import { Button, ButtonLink } from "../Components/ui/button";

import { CuentaEstado } from "../Components/cuenta-estado";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { useToast } from "../Components/ui/toast";
import { puedeGestionarAdministradores } from "../lib/administracion";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Perfil de administrador · Gestión de Residencia" }]; }
export default function PerfilAdministrador() {
  const { idUsuario } = useParams(); const datos = useData(); const { toast } = useToast();
  const [editar, setEditar] = useState(false); const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState(""); const [correo, setCorreo] = useState(""); const [telefono, setTelefono] = useState(""); const [confirmar, setConfirmar] = useState(false); const [error, setError] = useState("");
  const u = datos.usuarios.find((u) => u.idUsuario === idUsuario && u.rol === "administrador");
  if (!u) return <EmptyState icon="user" title="Administrador no encontrado" description="Volvé al listado para seleccionar un perfil." action={<ButtonLink to="/administracion/administradores">Ver administradores</ButtonLink>} />;
  const historial = datos.historialAdministrativo.filter((c) => c.idActor === u.idUsuario);
  const propio = u.idUsuario === usuarioActual.idUsuario;
  const gestionar = puedeGestionarAdministradores(datos);
  const suspendida = u.estado === "suspendido" || u.estado === "inactivo";
  return <div className="flex flex-col gap-6"><PageHeader eyebrow="Administración / Administradores" title={u.nombre} description={propio ? "Mi perfil y mi historial de modificaciones." : "Perfil y actividad del administrador."} actions={<BackToList to="/administracion/administradores" />} />
    <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><Avatar nombre={u.nombre} /><div><h2 className="text-lg font-semibold">{u.nombre}</h2><p className="text-sm text-slate-500">{u.correo}</p><div className="mt-2"><CuentaEstado estado={u.estado} /></div></div></div><div className="flex flex-wrap gap-2">{gestionar || propio ? <Button variant="outline" onClick={() => { setNombre(u.apellido && u.nombre.endsWith(` ${u.apellido}`) ? u.nombre.slice(0, -(u.apellido.length + 1)) : u.nombre); setApellido(u.apellido ?? ""); setCorreo(u.correo); setTelefono(u.telefono ?? ""); setEditar(!editar); setError(""); }}>Editar perfil</Button> : null}{gestionar && !propio ? <Button variant="outline" onClick={() => setConfirmar(true)}>{suspendida ? "Restablecer cuenta" : "Suspender cuenta"}</Button> : null}</div></div><dl className="mt-6 grid gap-4 sm:grid-cols-3"><div><dt className="text-xs text-slate-500">Teléfono</dt><dd className="mt-1 text-sm">{u.telefono || "Sin registrar"}</dd></div><div><dt className="text-xs text-slate-500">Permisos</dt><dd className="mt-1 text-sm">{u.gestionaAdministradores ? "Gestión de residencia y administradores" : "Gestión de residencia"}</dd></div><div><dt className="text-xs text-slate-500">Identificador</dt><dd className="mt-1 text-sm">{u.idUsuario}</dd></div></dl>
    {editar ? <FormularioConfirmado className="mt-6 space-y-4 border-t border-slate-200 pt-5" onSubmit={(e) => { e.preventDefault(); try { datos.actualizarAdministrador(u.idUsuario, { nombre, apellido, correo, telefono }); setEditar(false); setError(""); toast({ title: "Perfil actualizado" }); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar."); } }}><div className="grid gap-4 sm:grid-cols-2"><TextField id="perfil-nombre" label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} /><TextField id="perfil-apellido" label="Apellido(s)" required value={apellido} onChange={(e) => setApellido(e.target.value)} /><TextField id="perfil-correo" label="Correo electrónico" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} /><TextField id="perfil-telefono" label="Teléfono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" data-descartar onClick={() => setEditar(false)}>Cancelar</Button><Button type="submit">Guardar cambios</Button></div></FormularioConfirmado> : null}</section>
    {u.estado === "pendiente" ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">Pendiente de activación por su titular. El envío del enlace de activación todavía no está conectado.</p> : null}
    {propio ? <CambiarClave /> : null}
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
    <section className="space-y-4"><div><h2 className="text-lg font-semibold">Historial de modificaciones</h2><p className="text-sm text-slate-500">Acciones realizadas por {propio ? "vos" : u.nombre} · {historial.length} registros. Historial guardado en este navegador.</p></div><TableWrap><Table><THead><TR><TH>Fecha y hora</TH><TH>Sección</TH><TH>Acción</TH><TH>Detalle del cambio</TH></TR></THead><TBody>{historial.map((c) => <TR key={c.id}><TD className="whitespace-nowrap">{new Date(c.fecha).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</TD><TD>{c.seccion}</TD><TD>{c.accion}</TD><TD className="max-w-xl whitespace-normal break-words">{c.detalle}</TD></TR>)}{!historial.length ? <TR><TD colSpan={4}><EmptyState icon="contracts" title="Sin modificaciones registradas" description="Las acciones que realice este administrador aparecerán acá." /></TD></TR> : null}</TBody></Table></TableWrap></section>
    <ConfirmDialog open={confirmar} onClose={() => setConfirmar(false)} title={suspendida ? "Restablecer cuenta" : "Suspender cuenta"} description={suspendida ? "La cuenta recuperará el acceso con su contraseña actual." : "Se suspenderá su acceso y se conservarán su perfil y su historial."} confirmLabel={suspendida ? "Restablecer" : "Suspender"} onConfirm={() => { try { datos.suspenderCuenta(u.idUsuario, !suspendida); setError(""); toast({ title: suspendida ? "Cuenta restablecida" : "Cuenta suspendida" }); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cambiar el estado."); } }} />
  </div>;
}
