import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { esFechaISO } from "../lib/gestiones";
import { BackToList } from "../Components/ui/back-to-list";
import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { Button, ButtonLink } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { diasHasta, sumarDia } from "../lib/domain";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatFecha, formatARS } from "../lib/format";
import { useData } from "../lib/store";
import type { BorradorContrato, Contrato } from "../lib/types";

export function meta() {
  return [{ title: "Nuevo contrato · Gestión de Residencia" }];
}

const seccion = "rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export default function NuevoContrato() {
  return <ContratoForm />;
}

export function ContratoForm({ contrato, titularEditable = true }: { contrato?: Contrato; titularEditable?: boolean }) {
  const { alumnos, crearContrato, actualizarContrato, parametros } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const idBase = useId();
  const retorno = location.state as { contratoBorrador?: BorradorContrato } | null;
  const consultaDesde = searchParams.get("desde") ?? "";
  const desdeInicial = esFechaISO(consultaDesde) ? consultaDesde : FECHA_REFERENCIA;
  const destino = contrato ? `/contratos/${contrato.idContrato}` : "/contratos";
  const [datos, setDatos] = useState<BorradorContrato>(() => contrato ? {
    idAlumno: contrato.idAlumno, fechaDesde: contrato.fechaDesde, fechaHasta: contrato.fechaHasta,
    fechaFirma: contrato.fechaFirma ?? "",
    montoMensual: String(contrato.montoMensual ?? ""),
    depositoGarantia: String(contrato.depositoGarantia ?? ""),
    diaVencimientoPago: String(contrato.diaVencimientoPago ?? ""),
    observaciones: contrato.observaciones ?? "",
  } : retorno?.contratoBorrador ?? {
    idAlumno: searchParams.get("alumno") ?? "",
    fechaDesde: desdeInicial,
    fechaHasta: sumarDia(desdeInicial, parametros.duracionContrato - 1),
    fechaFirma: FECHA_REFERENCIA,
    montoMensual: String(parametros.cuotaMensual),
    depositoGarantia: String(parametros.deposito),
    diaVencimientoPago: String(parametros.diaVencimiento),
    observaciones: "",
  });
  const [error, setError] = useState("");
  const alumnosOrdenados = useMemo(
    () => [...alumnos].sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre)),
    [alumnos],
  );
  const alumno = alumnos.find((item) => item.idAlumno === datos.idAlumno);
  const duracion = datos.fechaDesde && datos.fechaHasta ? diasHasta(datos.fechaHasta, datos.fechaDesde) + 1 : 0;

  function actualizar(campo: keyof BorradorContrato, valor: string) {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alumno) { setError("Seleccioná un alumno registrado."); return; }
    const input = {
      idAlumno: datos.idAlumno, fechaDesde: datos.fechaDesde, fechaHasta: datos.fechaHasta,
      fechaFirma: datos.fechaFirma || undefined,
      montoMensual: datos.montoMensual === "" ? undefined : Number(datos.montoMensual),
      depositoGarantia: datos.depositoGarantia === "" ? undefined : Number(datos.depositoGarantia),
      diaVencimientoPago: datos.diaVencimientoPago === "" ? undefined : Number(datos.diaVencimientoPago),
      observaciones: datos.observaciones.trim(),
    };
    try {
      if (contrato) actualizarContrato(contrato.idContrato, input);
      else crearContrato(input);
      toast({ title: contrato ? "Contrato actualizado" : "Contrato creado", description: `${alumno.apellido}, ${alumno.nombre} · ${formatFecha(datos.fechaDesde)} al ${formatFecha(datos.fechaHasta)}` });
      navigate(destino);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el contrato."); }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Contratos" title={contrato ? `Modificar contrato ${contrato.idContrato}` : "Nuevo contrato"}
        description="Completá los datos del contrato de residencia. Los campos con asterisco son obligatorios."
        actions={
          contrato ? <ButtonLink to={destino} variant="outline">Volver al contrato</ButtonLink> : <BackToList to={destino} />
        }
      />
      <FormularioConfirmado onSubmit={handleSubmit} className="space-y-6">
        <section className={seccion}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alumno titular</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">{titularEditable ? "Seleccioná un alumno del padrón." : "El titular está asociado a una factura, un cobro o una baja registrada."}</p>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <SelectField id={`${idBase}-alumno`} label="Alumno" required disabled={!titularEditable} value={datos.idAlumno} onChange={(event) => actualizar("idAlumno", event.target.value)}>
                <option value="" disabled>Seleccionar alumno</option>
                {alumnosOrdenados.filter((a) => a.estado === "activo" || a.idAlumno === contrato?.idAlumno).map((item) => <option key={item.idAlumno} value={item.idAlumno}>{item.apellido}, {item.nombre} · DNI {item.documento}</option>)}
              </SelectField>
            </div>
            {!contrato ? <Button className="mt-6 shrink-0" variant="outline" aria-label="Cargar nuevo alumno y continuar con el contrato" title="Cargar nuevo alumno"
              onClick={() => navigate("/alumnos/nuevo", { state: { contratoBorrador: datos } })}>
              <Icon name="plus" className="h-4 w-4" />
            </Button> : null}
          </div>
          {alumno ? <dl className="mt-5 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3 dark:bg-slate-800">
            <div><dt className="text-slate-500">Documento</dt><dd className="mt-1 font-medium">{alumno.documento}</dd></div>
            <div><dt className="text-slate-500">Correo electrónico</dt><dd className="mt-1 break-words">{alumno.correo}</dd></div>
            <div><dt className="text-slate-500">Teléfono</dt><dd className="mt-1">{alumno.telefono}</dd></div>
          </dl> : null}
        </section>
        <section className={seccion}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Vigencia del contrato</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Indicá la fecha de firma y el período de residencia.</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField id={`${idBase}-firma`} label="Fecha de firma" type="date" required={!contrato || Boolean(contrato.fechaFirma)} value={datos.fechaFirma} onChange={(event) => actualizar("fechaFirma", event.target.value)} />
            <TextField id={`${idBase}-desde`} label="Desde" type="date" required value={datos.fechaDesde} onChange={(event) => actualizar("fechaDesde", event.target.value)} />
            <TextField id={`${idBase}-hasta`} label="Hasta" type="date" required min={datos.fechaDesde || undefined} value={datos.fechaHasta} onChange={(event) => actualizar("fechaHasta", event.target.value)} />
          </div>
        </section>
        <section className={seccion}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Condiciones económicas</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Importes expresados en pesos argentinos.</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField id={`${idBase}-monto`} label="Importe mensual (ARS)" type="number" min="0.01" step="0.01" required={!contrato || contrato.montoMensual !== undefined} value={datos.montoMensual} onChange={(event) => actualizar("montoMensual", event.target.value)} />
            <TextField id={`${idBase}-deposito`} label="Depósito de garantía (ARS)" type="number" min="0" step="0.01" hint="Opcional. Ingresá 0 si no corresponde." value={datos.depositoGarantia} onChange={(event) => actualizar("depositoGarantia", event.target.value)} />
            <TextField id={`${idBase}-dia`} label="Día de vencimiento del pago" type="number" min="1" max="31" step="1" required={!contrato || contrato.diaVencimientoPago !== undefined} hint="Entre el 1 y el 31 de cada mes." value={datos.diaVencimientoPago} onChange={(event) => actualizar("diaVencimientoPago", event.target.value)} />
          </div>
        </section>
        <section className={seccion}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Observaciones y condiciones particulares</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">Agregá acuerdos o aclaraciones relevantes para este contrato.</p>
          <label htmlFor={`${idBase}-observaciones`} className="mb-2 block text-sm font-medium">Observaciones (opcional)</label>
          <textarea id={`${idBase}-observaciones`} rows={5} maxLength={2000} value={datos.observaciones} onChange={(event) => actualizar("observaciones", event.target.value)} className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-950" />
          <p className="mt-1 text-right text-xs text-slate-500">{datos.observaciones.length}/2000 caracteres</p>
        </section>
        <section className={seccion} aria-label="Resumen del contrato">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Resumen antes de guardar</h2>
          <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">Titular</dt><dd className="mt-1 font-medium">{alumno ? `${alumno.apellido}, ${alumno.nombre}` : "Sin seleccionar"}</dd></div>
            <div><dt className="text-slate-500">Duración</dt><dd className="mt-1">{duracion >= 1 ? `${duracion} días de residencia` : "Revisá las fechas"}</dd></div>
            <div><dt className="text-slate-500">Importe mensual</dt><dd className="mt-1 font-medium">{Number(datos.montoMensual) > 0 ? formatARS(Number(datos.montoMensual)) : "Sin completar"}</dd></div>
          </dl>
        </section>
        {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <Button variant="outline" data-descartar onClick={() => navigate(destino)}>Cancelar</Button>
          <Button type="submit"><Icon name={contrato ? "check" : "plus"} className="h-4 w-4" />{contrato ? "Guardar cambios" : "Guardar contrato"}</Button>
        </div>
      </FormularioConfirmado>
    </div>
  );
}
