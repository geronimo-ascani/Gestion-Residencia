import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { contratosSuperpuestos, diasHasta, sumarDia } from "../lib/domain";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatFecha, formatARS } from "../lib/format";
import { useData } from "../lib/store";
import type { BorradorContrato } from "../lib/types";

export function meta() {
  return [{ title: "Nuevo contrato · Gestión de Residencia" }];
}

const seccion = "rounded-xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export default function NuevoContrato() {
  const { alumnos, contratos, crearContrato } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const idBase = useId();
  const retorno = location.state as { contratoBorrador?: BorradorContrato } | null;
  const desdeInicial = searchParams.get("desde") ?? FECHA_REFERENCIA;
  const [datos, setDatos] = useState<BorradorContrato>(() => retorno?.contratoBorrador ?? {
    idAlumno: searchParams.get("alumno") ?? "",
    fechaDesde: desdeInicial,
    fechaHasta: sumarDia(desdeInicial, 365),
    fechaFirma: FECHA_REFERENCIA,
    montoMensual: "",
    depositoGarantia: "",
    diaVencimientoPago: "10",
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
    if (!datos.fechaDesde || !datos.fechaHasta || datos.fechaHasta <= datos.fechaDesde) {
      setError("La fecha hasta debe ser posterior a la fecha desde."); return;
    }
    if (!datos.fechaFirma || datos.fechaFirma > datos.fechaHasta) {
      setError("La fecha de firma no puede ser posterior al fin del contrato."); return;
    }
    if (!datos.montoMensual || !Number.isFinite(Number(datos.montoMensual)) || Number(datos.montoMensual) <= 0 ||
      (datos.depositoGarantia !== "" && (!Number.isFinite(Number(datos.depositoGarantia)) || Number(datos.depositoGarantia) < 0)) ||
      !Number.isInteger(Number(datos.diaVencimientoPago)) || Number(datos.diaVencimientoPago) < 1 || Number(datos.diaVencimientoPago) > 28) {
      setError("Revisá el importe mensual, el depósito y el día de vencimiento del pago."); return;
    }
    if (contratosSuperpuestos(contratos, datos)) {
      setError("Las fechas se superponen con otro contrato del alumno."); return;
    }
    crearContrato({
      idAlumno: datos.idAlumno, fechaDesde: datos.fechaDesde, fechaHasta: datos.fechaHasta,
      fechaFirma: datos.fechaFirma, montoMensual: Number(datos.montoMensual),
      depositoGarantia: datos.depositoGarantia === "" ? undefined : Number(datos.depositoGarantia),
      diaVencimientoPago: Number(datos.diaVencimientoPago), observaciones: datos.observaciones.trim(),
    });
    toast({ title: "Contrato creado", description: `${alumno.apellido}, ${alumno.nombre} · ${formatFecha(datos.fechaDesde)} al ${formatFecha(datos.fechaHasta)}` });
    navigate("/contratos");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Contratos" title="Nuevo contrato"
        description="Completá los datos del contrato de residencia. Los campos con asterisco son obligatorios."
        actions={
          <Link to="/contratos">
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al listado
            </Button>
          </Link>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={seccion}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alumno titular</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Seleccioná un alumno del padrón o registrá uno nuevo para continuar.</p>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <SelectField id={`${idBase}-alumno`} label="Alumno" required value={datos.idAlumno} onChange={(event) => actualizar("idAlumno", event.target.value)}>
                <option value="" disabled>Seleccionar alumno</option>
                {alumnosOrdenados.map((item) => <option key={item.idAlumno} value={item.idAlumno}>{item.apellido}, {item.nombre} · DNI {item.documento}</option>)}
              </SelectField>
            </div>
            <Button className="mt-6 shrink-0" variant="outline" aria-label="Cargar nuevo alumno y continuar con el contrato" title="Cargar nuevo alumno"
              onClick={() => navigate("/alumnos/nuevo", { state: { contratoBorrador: datos } })}>
              <Icon name="plus" className="h-4 w-4" />
            </Button>
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
            <TextField id={`${idBase}-firma`} label="Fecha de firma" type="date" required value={datos.fechaFirma} onChange={(event) => actualizar("fechaFirma", event.target.value)} />
            <TextField id={`${idBase}-desde`} label="Desde" type="date" required value={datos.fechaDesde} onChange={(event) => actualizar("fechaDesde", event.target.value)} />
            <TextField id={`${idBase}-hasta`} label="Hasta" type="date" required min={datos.fechaDesde ? sumarDia(datos.fechaDesde) : undefined} value={datos.fechaHasta} onChange={(event) => actualizar("fechaHasta", event.target.value)} />
          </div>
        </section>
        <section className={seccion}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Condiciones económicas</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Importes expresados en pesos argentinos.</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField id={`${idBase}-monto`} label="Importe mensual (ARS)" type="number" min="0.01" step="0.01" required value={datos.montoMensual} onChange={(event) => actualizar("montoMensual", event.target.value)} />
            <TextField id={`${idBase}-deposito`} label="Depósito de garantía (ARS)" type="number" min="0" step="0.01" hint="Opcional. Ingresá 0 si no corresponde." value={datos.depositoGarantia} onChange={(event) => actualizar("depositoGarantia", event.target.value)} />
            <TextField id={`${idBase}-dia`} label="Día de vencimiento del pago" type="number" min="1" max="28" step="1" required hint="Entre el 1 y el 28 de cada mes." value={datos.diaVencimientoPago} onChange={(event) => actualizar("diaVencimientoPago", event.target.value)} />
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
            <div><dt className="text-slate-500">Duración</dt><dd className="mt-1">{duracion > 1 ? `${duracion} días de residencia` : "Revisá las fechas"}</dd></div>
            <div><dt className="text-slate-500">Importe mensual</dt><dd className="mt-1 font-medium">{Number(datos.montoMensual) > 0 ? formatARS(Number(datos.montoMensual)) : "Sin completar"}</dd></div>
          </dl>
        </section>
        {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <Button variant="outline" onClick={() => navigate("/contratos")}>Cancelar</Button>
          <Button type="submit"><Icon name="plus" className="h-4 w-4" />Guardar contrato</Button>
        </div>
      </form>
    </div>
  );
}
