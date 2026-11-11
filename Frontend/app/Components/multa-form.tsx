import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router";
import { useData } from "../lib/store";
import type { DatosMultaInput } from "../lib/store";
import type { Multa } from "../lib/types";
import { calendarioMulta, normalizarBusqueda, TIPOS_MULTA } from "../lib/multas";
import { contratoVigente } from "../lib/domain";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatARS, formatFecha } from "../lib/format";
import { Button } from "./ui/button";
import { TextField } from "./ui/text-field";
import { SelectField } from "./ui/select-field";

export function SeccionMulta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <section className="space-y-5 border-b border-slate-200 pb-6 dark:border-slate-800"><h2 className="text-lg font-semibold">{titulo}</h2>{children}</section>;
}
export const hojaMulta = "mx-auto w-full max-w-4xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900";
const area = "mt-2 block min-h-28 w-full rounded-md border border-slate-400 bg-transparent p-3 text-sm focus:outline-brand-600 dark:border-slate-700";

export function MultaForm({ multa, alumnoInicial = "", onSave }: {
  multa?: Multa; alumnoInicial?: string;
  onSave: (datos: DatosMultaInput, alumnos: string[]) => void;
}) {
  const { alumnos, contratos } = useData();
  const id = useId();
  const [seleccion, setSeleccion] = useState<string[]>(multa ? [multa.idAlumno] : alumnos.some((a) => a.idAlumno === alumnoInicial) ? [alumnoInicial] : []);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState(multa?.tipo ?? "");
  const [motivo, setMotivo] = useState(multa?.motivo ?? "");
  const [observaciones, setObservaciones] = useState(multa?.observaciones ?? "");
  const [huboDanios, setHuboDanios] = useState(multa?.huboDanios ?? false);
  const [detalleDanios, setDetalleDanios] = useState(multa?.detalleDanios ?? "");
  const [extra, setExtra] = useState(multa?.tipo === "extraordinaria" ? String(multa.montoSancion ?? multa.monto) : "");
  const [danios, setDanios] = useState(multa?.montoDanios ? String(multa.montoDanios) : "");
  const [error, setError] = useState("");
  const arancel = TIPOS_MULTA.find((t) => t.id === tipo);
  const montoSancion = tipo === "extraordinaria" ? Number(extra) : arancel?.monto ?? 0;
  const montoDanios = huboDanios ? Number(danios) : 0;
  const total = montoSancion + montoDanios;
  const visibles = [...alumnos].sort((a, b) => a.apellido.localeCompare(b.apellido)).filter((a) => normalizarBusqueda(`${a.apellido} ${a.nombre} ${a.documento}`).includes(normalizarBusqueda(busqueda)));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seleccion.length || !arancel || !Number.isFinite(montoSancion) || montoSancion <= 0 || !Number.isFinite(montoDanios) || (huboDanios && (!detalleDanios.trim() || montoDanios <= 0)) || !motivo.trim()) {
      setError("Seleccioná al menos un alumno y completá el tipo, el motivo y los importes mayores a cero que correspondan."); return;
    }
    onSave({ tipo, montoSancion, montoDanios, motivo: motivo.trim(), observaciones: observaciones.trim(), huboDanios, detalleDanios: huboDanios ? detalleDanios.trim() : "" }, seleccion);
  }
  return <form onSubmit={submit} className={hojaMulta}>
    <div className="border-b-2 border-brand-600 pb-5"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Gestión de Residencia · Administración</p><h2 className="mt-2 text-2xl font-semibold">Acta de sanción económica</h2><p className="mt-2 text-sm text-slate-500">{multa ? `Referencia ${multa.idMulta}` : "Nueva emisión"} · {formatFecha(multa?.fechaEmision ?? FECHA_REFERENCIA)}</p></div>
    <SeccionMulta titulo="1. Alumnos involucrados">
      {multa ? <p>{alumnos.find((a) => a.idAlumno === multa.idAlumno)?.apellido}, {alumnos.find((a) => a.idAlumno === multa.idAlumno)?.nombre}</p> : <>
        <div className="space-y-3" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setBuscadorAbierto(false); }}>
          <label className="block text-sm font-medium" htmlFor={`${id}-buscar`}>Buscar alumno por DNI, nombre o apellido</label>
          <input id={`${id}-buscar`} className="w-full rounded-md border border-slate-400 bg-transparent p-3" placeholder="Hacé clic para buscar y seleccionar alumnos…" value={busqueda} aria-expanded={buscadorAbierto} aria-controls={`${id}-resultados`} onFocus={() => setBuscadorAbierto(true)} onClick={() => setBuscadorAbierto(true)} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setBuscadorAbierto(false); } }} onChange={(e) => { setBusqueda(e.target.value); setBuscadorAbierto(true); }} />
          {buscadorAbierto && <div id={`${id}-resultados`} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span>{visibles.length} alumnos encontrados</span><button type="button" className="font-medium text-brand-700 dark:text-brand-300" onClick={() => setBuscadorAbierto(false)}>Cerrar búsqueda</button></div>
            <div className="max-h-64 overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Seleccionar</th><th className="p-3">Apellido y nombre</th><th className="p-3">DNI</th></tr></thead><tbody>{visibles.map((a) => <tr key={a.idAlumno} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3"><input aria-label={`Seleccionar a ${a.apellido}, ${a.nombre}`} type="checkbox" checked={seleccion.includes(a.idAlumno)} onChange={(e) => setSeleccion((prev) => e.target.checked ? [...prev, a.idAlumno] : prev.filter((v) => v !== a.idAlumno))} /></td><td className="p-3">{a.apellido}, {a.nombre}</td><td className="p-3">{a.documento}</td></tr>)}{!visibles.length && <tr><td colSpan={3} className="p-4 text-center text-slate-500">Sin coincidencias.</td></tr>}</tbody></table></div>
          </div>}
        </div>
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50"><p className="text-sm font-medium">Alumnos seleccionados ({seleccion.length})</p><div className="mt-3 flex flex-wrap gap-2">{seleccion.map((alumno) => { const a = alumnos.find((a) => a.idAlumno === alumno); return <button key={alumno} type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" aria-label={`Quitar a ${a?.apellido}, ${a?.nombre}`} onClick={() => setSeleccion((prev) => prev.filter((v) => v !== alumno))}>{a?.apellido}, {a?.nombre} <span aria-hidden="true" className="ml-2">×</span></button>; })}{!seleccion.length && <p className="text-sm text-slate-500">Buscá y seleccioná al menos un alumno.</p>}</div></div>
        <p className="text-sm text-slate-500">Se emitirá una multa independiente por alumno, con el importe completo.</p>
      </>}
    </SeccionMulta>
    <SeccionMulta titulo="2. Clasificación y motivo">
      <SelectField id={`${id}-tipo`} label="Tipo de multa" value={tipo} required onChange={(e) => setTipo(e.target.value)}><option value="">Seleccionar</option>{TIPOS_MULTA.map((t) => <option key={t.id} value={t.id}>{t.nombre} · {t.id === "extraordinaria" ? "Importe manual" : formatARS(t.monto)}</option>)}</SelectField>
      <p className="text-sm text-slate-500">Importe establecido según el tipo de sanción.</p>
      {tipo === "extraordinaria" && <TextField id={`${id}-extra`} label="Importe de la multa extraordinaria (ARS)" type="number" min="0.01" step="0.01" required value={extra} onChange={(e) => setExtra(e.target.value)} />}
      <label className="block text-sm font-medium" htmlFor={`${id}-motivo`}>Motivo de la sanción *<textarea id={`${id}-motivo`} className={area} required maxLength={4000} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describí los hechos y la razón de la multa." /></label>
    </SeccionMulta>
    <SeccionMulta titulo="3. Daños y observaciones">
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={huboDanios} onChange={(e) => setHuboDanios(e.target.checked)} />El alumno rompió o dañó un bien de la residencia</label>
      {huboDanios && <label className="block text-sm font-medium" htmlFor={`${id}-danios`}>Bien y daño ocasionado *<textarea id={`${id}-danios`} className={area} required maxLength={4000} value={detalleDanios} onChange={(e) => setDetalleDanios(e.target.value)} /></label>}
      {huboDanios && <TextField id={`${id}-valor-danios`} label="Valor de reparación o reposición (ARS)" type="number" min="0.01" step="0.01" required value={danios} onChange={(e) => setDanios(e.target.value)} hint="Se suma al importe de la sanción para cada alumno seleccionado." />}
      <label className="block text-sm font-medium" htmlFor={`${id}-observaciones`}>Observaciones adicionales<textarea id={`${id}-observaciones`} className={area} maxLength={4000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></label>
    </SeccionMulta>
    <SeccionMulta titulo="4. Importe y condiciones de cobro">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-resumen-sancion`} label="Importe de la sanción por alumno" readOnly value={arancel ? formatARS(montoSancion || 0) : "Seleccioná un tipo de multa"} />
        <TextField id={`${id}-resumen-danios`} label="Reparación o reposición por alumno" readOnly value={formatARS(montoDanios || 0)} />
      </div>
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-5 dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-medium">Total de la multa por alumno</p><p className="mt-2 text-3xl font-semibold tabular-nums">{arancel && Number.isFinite(total) ? formatARS(total) : "Pendiente de completar"}</p><p className="mt-2 text-sm text-slate-500">Incluye la sanción y los daños declarados. No se divide entre los alumnos seleccionados.</p></div>
      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700"><legend className="px-2 text-sm font-semibold">Calendario de cobro por alumno</legend>
        {!seleccion.length && <p className="text-sm text-slate-500">Seleccioná alumnos para consultar sus fechas de cobro.</p>}
        {seleccion.map((alumno) => { const a = alumnos.find((a) => a.idAlumno === alumno); const calendario = multa ?? calendarioMulta(FECHA_REFERENCIA, contratoVigente(contratos, alumno)?.diaVencimientoPago); return <div key={alumno} className="space-y-3 border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-700"><p className="text-sm font-medium">{a?.apellido}, {a?.nombre}</p><div className="grid gap-3 sm:grid-cols-3"><TextField id={`${id}-${alumno}-desde`} label="Primera factura" readOnly value={calendario.periodoDesde ?? "Sin informar"} /><TextField id={`${id}-${alumno}-hasta`} label="Última factura sin recargo" readOnly value={calendario.periodoHasta ?? "Sin informar"} /><TextField id={`${id}-${alumno}-vence`} label="Fecha límite de pago" readOnly value={formatFecha(calendario.fechaVence)} /></div></div>; })}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2"><TextField id={`${id}-recargo`} label="Recargo único si vence (20%)" readOnly value={arancel ? formatARS(Math.round(total * 20) / 100) : "Pendiente"} /><TextField id={`${id}-total-vencido`} label="Total por alumno después del vencimiento" readOnly value={arancel ? formatARS(Math.round(total * 120) / 100) : "Pendiente"} /></div>
      <p className="text-sm text-slate-500">El cobro comienza en la factura del mes siguiente. Las emisiones posteriores al día 15 pueden pagarse completas hasta la segunda factura. El vencimiento respeta el día de pago del contrato; si no está definido, se usa el día 10.</p>
    </SeccionMulta>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3"><Link to={multa ? `/multas/${multa.idMulta}` : "/multas"}><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit">{multa ? "Guardar cambios" : `Emitir ${seleccion.length === 1 ? "multa" : "multas"}`}</Button></div>
  </form>;
}
