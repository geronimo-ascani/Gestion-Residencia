import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatARS } from "../lib/format";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Emitir multa · Gestión de Residencia" }];
}

export default function NuevaMulta() {
  const { alumnos, emitirMulta } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idBase = useId();
  const alumnoInicial = searchParams.get("alumno") ?? "";
  const [idAlumno, setIdAlumno] = useState(alumnoInicial);
  const [monto, setMonto] = useState("");
  const [fechaVence, setFechaVence] = useState("2026-11-19");
  const [errores, setErrores] = useState({
    alumno: "",
    monto: "",
    fechaVence: "",
  });

  const alumnosOrdenados = useMemo(
    () => [...alumnos].sort((a, b) => a.apellido.localeCompare(b.apellido)),
    [alumnos],
  );
  const alumnoPrefijado = alumnos.some(
    (alumno) => alumno.idAlumno === alumnoInicial,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const importe = Number(monto);
    const nuevosErrores = { alumno: "", monto: "", fechaVence: "" };

    if (!alumnos.some((alumno) => alumno.idAlumno === idAlumno)) {
      nuevosErrores.alumno = "Seleccioná un alumno.";
    }
    if (!Number.isFinite(importe) || importe <= 0) {
      nuevosErrores.monto = "Ingresá un monto mayor a cero.";
    }
    if (!fechaVence || fechaVence < FECHA_REFERENCIA) {
      nuevosErrores.fechaVence = "El vencimiento no puede ser anterior a hoy.";
    }

    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    const idMulta = emitirMulta({ idAlumno, monto: importe, fechaVence });
    const alumno = alumnos.find((item) => item.idAlumno === idAlumno);
    toast({
      title: "Multa emitida",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatARS(importe)}`,
    });
    navigate(`/multas/${idMulta}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Multas"
        title="Emitir multa"
        description="La multa queda pendiente hasta que se registre su pago."
        actions={
          <Link to="/multas">
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al listado
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id={`${idBase}-alumno`}
            label="Alumno"
            value={idAlumno}
            required
            disabled={alumnoPrefijado}
            error={errores.alumno || undefined}
            onChange={(event) => {
              setIdAlumno(event.target.value);
              setErrores((previo) => ({ ...previo, alumno: "" }));
            }}
          >
            <option value="">Seleccionar alumno</option>
            {alumnosOrdenados.map((alumno) => (
              <option key={alumno.idAlumno} value={alumno.idAlumno}>
                {alumno.apellido}, {alumno.nombre} · DNI {alumno.documento}
              </option>
            ))}
          </SelectField>
          <TextField
            id={`${idBase}-monto`}
            label="Monto (ARS)"
            type="number"
            min={1}
            step={1}
            value={monto}
            required
            error={errores.monto || undefined}
            onChange={(event) => {
              setMonto(event.target.value);
              setErrores((previo) => ({ ...previo, monto: "" }));
            }}
          />
          <TextField
            id={`${idBase}-vence`}
            label="Fecha de vencimiento"
            type="date"
            min={FECHA_REFERENCIA}
            value={fechaVence}
            required
            error={errores.fechaVence || undefined}
            onChange={(event) => {
              setFechaVence(event.target.value);
              setErrores((previo) => ({ ...previo, fechaVence: "" }));
            }}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to="/multas">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            Emitir multa
          </Button>
        </div>
      </form>
    </div>
  );
}