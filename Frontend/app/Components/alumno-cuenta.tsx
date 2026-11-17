import { claveInicial } from "../lib/credenciales";
import { useState } from "react";
import { Button } from "./ui/button";
import { CuentaEstado } from "./cuenta-estado";
import { Dialog } from "./ui/dialog";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { TextField } from "./ui/text-field";
import { useToast } from "./ui/toast";
import { estadoAcceso } from "../lib/administracion";
import { contratoVigente } from "../lib/domain";
import { useData } from "../lib/store";
import type { Alumno } from "../lib/types";

export function AlumnoCuenta({ alumno }: { alumno: Alumno }) {
  const datos = useData(); const { toast } = useToast();
  const [abierto, setAbierto] = useState(false); const [correo, setCorreo] = useState(alumno.correo); const [error, setError] = useState(""); const [confirmar, setConfirmar] = useState(false);
  const usuario = datos.usuarios.find((u) => u.idAlumno === alumno.idAlumno);
  const vigente = !!contratoVigente(datos.contratos, alumno.idAlumno);
  const suspendida = usuario?.estado === "suspendido" || usuario?.estado === "inactivo";
  return <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-base font-semibold">Cuenta de acceso</h2><div className="mt-2"><CuentaEstado estado={estadoAcceso(usuario, datos)} /></div><p className="mt-3 text-sm text-slate-500">{usuario ? `Usuario: ${usuario.correo}` : "La ficha del alumno puede existir sin correo y sin cuenta de acceso."}</p><p className="mt-1 text-sm text-slate-500">{!vigente ? "El acceso al portal requiere un contrato vigente. La ficha y el historial se conservan." : usuario?.estado === "pendiente" ? "Su titular debe activar la cuenta y elegir su contraseña. El envío de invitaciones todavía no está conectado." : usuario ? "La contraseña es personal. La administración no puede consultarla." : "Creá la cuenta con su correo y una contraseña inicial generada con el primer apellido y los últimos 3 dígitos del DNI."}</p></div><div>{!usuario ? <Button disabled={!vigente} onClick={() => { setCorreo(alumno.correo); setError(""); setAbierto(true); }}>Crear usuario</Button> : <Button variant="outline" disabled={suspendida && !vigente} onClick={() => { setError(""); setConfirmar(true); }}>{suspendida ? "Restablecer cuenta" : "Suspender cuenta"}</Button>}</div></div>{error && !abierto ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
    <Dialog open={abierto} onClose={() => setAbierto(false)} title="Crear usuario del alumno" description={`${alumno.nombre} ${alumno.apellido}`}><form className="mt-5 space-y-5" onSubmit={(e) => { e.preventDefault(); try { datos.crearAccesoAlumno(alumno.idAlumno, correo); setAbierto(false); toast({ title: "Usuario creado", description: "Cuenta activa con correo y contraseña inicial." }); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo crear el usuario."); } }}><TextField id="cuenta-alumno-correo" label="Correo para iniciar sesión" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} /><TextField id="clave-inicial-alumno" label="Contraseña inicial" readOnly value={claveInicial(alumno.apellido, alumno.documento)} /><p className="text-sm text-slate-500">El correo se guardará también en la ficha. La cuenta quedará activa y el alumno podrá cambiar la contraseña desde Mi perfil.</p>{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit">Crear usuario</Button></div></form></Dialog>
    <ConfirmDialog open={confirmar} onClose={() => setConfirmar(false)} title={suspendida ? "Restablecer cuenta" : "Suspender cuenta"} description={suspendida ? "Se restablecerá el acceso con su contraseña actual." : "Se suspenderá el acceso al portal. Los datos del alumno se conservarán."} confirmLabel={suspendida ? "Restablecer" : "Suspender"} onConfirm={() => { if (!usuario) return; try { datos.suspenderCuenta(usuario.idUsuario, !suspendida); toast({ title: suspendida ? "Cuenta restablecida" : "Cuenta suspendida" }); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cambiar el estado."); } }} />
  </section>;
}
