import { useState } from "react";
import type { FormEvent } from "react";
import { useData } from "../lib/store";
import { Button } from "./ui/button";
import { PasswordField } from "./ui/password-field";
import { Icon } from "./ui/icons";
import { useToast } from "./ui/toast";

export function CambiarClave({ portal = false }: { portal?: boolean }) {
  const { cambiarClave } = useData();
  const { toast } = useToast();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (nueva !== confirmacion) { setError("Las contraseñas nuevas no coinciden."); return; }
    setOcupado(true);
    try {
      await cambiarClave(actual, nueva);
      setActual(""); setNueva(""); setConfirmacion("");
      toast({ title: "Contraseña actualizada" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally { setOcupado(false); }
  }

  return <section className={portal ? "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" : "rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"}>
    {portal ? <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"><Icon name="settings" className="h-5 w-5" /></span><div><h2 className="text-base font-semibold">Seguridad de tu cuenta</h2><p className="mt-1 text-xs text-slate-500">Elegí una contraseña que solo conozcas vos.</p></div></div> : <h2 className="text-lg font-semibold">Cambiar contraseña</h2>}
    <form className={portal ? "space-y-6 p-6" : "mt-5 space-y-4"} onSubmit={guardar}>
      {portal ? <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 dark:bg-brand-900/20"><Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" /><p className="text-sm leading-6 text-brand-800 dark:text-brand-200">Usá al menos 8 caracteres. Te recomendamos combinar letras, números y símbolos, y evitar datos personales.</p></div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={portal ? "sm:col-span-2" : ""}><PasswordField id="clave-actual" label="Contraseña actual" required autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} /></div>
        <PasswordField id="clave-nueva" label="Nueva contraseña" required minLength={8} autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
        <PasswordField id="clave-confirmar" label="Confirmar nueva contraseña" required autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
      </div>
      {!portal ? <p className="text-sm text-slate-500">La nueva contraseña debe tener al menos 8 caracteres.</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</p> : null}
      <div className={portal ? "flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800" : ""}><Button type="submit" className={portal ? "rounded-xl" : undefined} isLoading={ocupado}>Guardar contraseña</Button>{portal ? <p className="text-xs text-slate-500">El cambio se aplica a tu cuenta de acceso.</p> : null}</div>
    </form>
  </section>;
}
