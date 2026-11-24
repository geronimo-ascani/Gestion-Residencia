import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { BackToList } from "../Components/ui/back-to-list";
import { useState } from "react";
import { Button, ButtonLink } from "../Components/ui/button";

import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { SelectField } from "../Components/ui/select-field";
import { puedeGestionarAdministradores } from "../lib/administracion";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Nuevo administrador · Gestión de Residencia" }]; }
export default function NuevoAdministrador() {
  const datos = useData();
  const [guardando, setGuardando] = useState(false);
  const [cuenta, setCuenta] = useState<{ idUsuario: string; claveGenerada: string } | null>(null);
  const [nombre, setNombre] = useState(""); const [apellido, setApellido] = useState(""); const [documento, setDocumento] = useState(""); const [correo, setCorreo] = useState(""); const [telefono, setTelefono] = useState(""); const [permiso, setPermiso] = useState("residencia"); const [error, setError] = useState("");
  return <div className="flex flex-col gap-6"><PageHeader eyebrow="Administración / Administradores" title="Nuevo administrador" description="Registrá un integrante del equipo con una cuenta personal." actions={<BackToList to="/administracion/administradores" />} />
    {cuenta ? (
      <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Administrador registrado</h2>
        <TextField id="admin-clave" label="Contraseña inicial" readOnly value={cuenta.claveGenerada} />
        <p className="text-sm text-slate-500">Compartila por un canal privado. Se muestra una sola vez.</p>
        <ButtonLink to={`/administracion/administradores/${cuenta.idUsuario}`}>Ver cuenta</ButtonLink>
      </section>
    ) : puedeGestionarAdministradores(datos) ? (
      <FormularioConfirmado className="space-y-6" onSubmit={async (e) => {
        e.preventDefault();
        if (guardando) return;
        setGuardando(true);
        setError("");
        try {
          setCuenta(await datos.crearAdministrador({
            nombre, apellido, documento, correo, telefono, gestionaAdministradores: permiso === "administradores",
          }));
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
        } finally {
          setGuardando(false);
        }
      }}>
    <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-semibold">Datos del perfil</h2><p className="mt-1 mb-6 text-sm text-slate-500">El correo será su identificador para iniciar sesión.</p><div className="grid gap-5 sm:grid-cols-2"><TextField id="admin-nombre" label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} /><TextField id="admin-apellido" label="Apellido(s)" required value={apellido} onChange={(e) => setApellido(e.target.value)} /><TextField id="admin-dni" label="DNI" required inputMode="numeric" pattern="[0-9. -]{3,}" value={documento} onChange={(e) => setDocumento(e.target.value)} /><TextField id="admin-correo" label="Correo electrónico" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} /><TextField id="admin-telefono" label="Teléfono (opcional)" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} /><SelectField id="admin-permisos" label="Permisos" value={permiso} onChange={(e) => setPermiso(e.target.value)}><option value="residencia">Gestión de residencia</option><option value="administradores">Gestión de residencia y administradores</option></SelectField></div><p className="mt-5 text-sm text-slate-500">El permiso para gestionar administradores permite agregar y suspender cuentas del equipo.</p></section>
    <p className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-100">La cuenta quedará activa con una contraseña inicial aleatoria. Su titular podrá cambiarla desde Mi perfil.</p>{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}<div className="flex justify-end gap-2"><ButtonLink to="/administracion/administradores" variant="outline" data-descartar>Cancelar</ButtonLink><Button type="submit" isLoading={guardando}>Crear administrador</Button></div></FormularioConfirmado>
    ) : <p role="alert">No tenés permiso para crear administradores.</p>}
  </div>;
}
