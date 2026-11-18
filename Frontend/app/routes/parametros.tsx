import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { useState } from "react";

import { CatalogoAlumnos } from "../Components/catalogo-alumnos";
import { Button, ButtonLink } from "../Components/ui/button";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { SelectField } from "../Components/ui/select-field";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { useToast } from "../Components/ui/toast";
import { CAMPOS_PARAMETROS } from "../lib/parametros";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Configuración del Sistema · Gestión de Residencia" }]; }
export default function Parametros() {
  const { parametros, guardarParametros } = useData(); const { toast } = useToast();
  const [borrador, setBorrador] = useState(() => Object.fromEntries(Object.entries(parametros).map(([k,v]) => [k, String(v)])));
  const [modulo, setModulo] = useState(""); const [error, setError] = useState(""); const [confirmar, setConfirmar] = useState(false);
  const modulos = [...new Set(CAMPOS_PARAMETROS.map((c) => c.modulo))];
  const mostrarParametros = !modulo || modulos.some((m) => m === modulo);
  const cambios = CAMPOS_PARAMETROS.filter((c) => borrador[c.clave] !== String(parametros[c.clave]));
  function valores() { return Object.fromEntries(Object.entries(borrador).map(([k,v]) => [k, v.trim() ? Number(v) : NaN])) as typeof parametros; }
  return <div className="flex flex-col gap-6"><PageHeader eyebrow="Administración" title="Configuración del Sistema" description="Modificá los valores tabulados, agrupados por módulo y pantalla." />
  <p className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-100">Los nuevos valores se aplican a futuras multas y nuevos contratos. Los registros existentes conservan sus importes. Para ajustar un contrato particular, ingresá a su detalle.</p>
  <SelectField id="configuracion-sistema-modulo" label="Módulo" value={modulo} onChange={(e) => setModulo(e.target.value)}><option value="">Todos los módulos</option>{modulos.map((m) => <option key={m}>{m}</option>)}<option value="carreras">Carreras</option><option value="vinculos">Vínculos de emergencia</option></SelectField>
  {mostrarParametros ? <FormularioConfirmado cambios={cambios.length > 0} confirmarGuardado={false} className="space-y-6" onSubmit={(e) => { e.preventDefault(); setError(""); setConfirmar(true); }}>
  {["Multas", "Contratos"].map((pantalla) => { const campos = CAMPOS_PARAMETROS.filter((c) => c.pantalla === pantalla && (!modulo || c.modulo === modulo)); return campos.length ? <section key={pantalla} className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs uppercase tracking-wide text-slate-500">{campos[0].modulo}</p><h2 className="mt-1 text-lg font-semibold">{pantalla}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{campos.map((c) => <TextField key={c.clave} id={`parametro-${c.clave}`} label={`${c.nombre} (${c.unidad})`} required type="number" min={c.min} max={c.max} step={c.step} value={borrador[c.clave]} onChange={(e) => setBorrador({ ...borrador, [c.clave]: e.target.value })} hint={`Valor actual: ${parametros[c.clave]} ${c.unidad}`} />)}</div>{pantalla === "Multas" ? <p className="mt-4 text-sm text-slate-500">Las multas extraordinarias y los daños conservan su importe manual.</p> : <p className="mt-4 text-sm text-slate-500">Son valores sugeridos: pueden ajustarse al crear cada contrato.</p>}</section> : null; })}
  {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}<div className="flex flex-wrap items-center justify-end gap-3"><p className="text-sm text-slate-500">{cambios.length} valores modificados</p><Button type="button" variant="outline" data-descartar disabled={!cambios.length} onClick={() => { setBorrador(Object.fromEntries(Object.entries(parametros).map(([k,v]) => [k,String(v)]))); setError(""); }}>Descartar cambios</Button><Button type="submit" disabled={!cambios.length}>Guardar configuración</Button></div></FormularioConfirmado> : null}
  {!modulo || modulo === "carreras" ? <CatalogoAlumnos catalogo="carreras" titulo="Carreras" /> : null}
  {!modulo || modulo === "vinculos" ? <CatalogoAlumnos catalogo="vinculos" titulo="Vínculos de emergencia" /> : null}
  <section className="rounded-xl border border-slate-300 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">Otros catálogos</h2><p className="mt-1 text-sm text-slate-500">Los valores propios de cada registro se administran desde sus pantallas.</p><div className="mt-4 flex flex-wrap gap-3"><ButtonLink to="/limpieza" variant="outline">Tareas y grupos de limpieza</ButtonLink><ButtonLink to="/ambientes" variant="outline">Ambientes y equipamiento</ButtonLink><ButtonLink to="/habitaciones" variant="outline">Habitaciones y capacidades</ButtonLink></div></section>
  <ConfirmDialog open={confirmar} onClose={() => setConfirmar(false)} title="Guardar configuración" description={cambios.map((c) => `${c.nombre}: ${parametros[c.clave]} → ${borrador[c.clave]}`).join(" · ")} confirmLabel="Guardar cambios" tone="brand" onConfirm={() => { try { guardarParametros(valores()); toast({ title: "Configuración actualizada", description: "Los nuevos valores se aplicarán en futuras operaciones." }); } catch (err) { setError(err instanceof Error ? err.message : "No se pudieron guardar los parámetros."); } }} />
  </div>;
}
