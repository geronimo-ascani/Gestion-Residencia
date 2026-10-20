import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { FECHA_REFERENCIA } from "../../lib/config";
import { formatFecha } from "../../lib/format";
import { useData } from "../../lib/store";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { SelectField } from "../ui/select-field";
import { TextField } from "../ui/text-field";
import { useToast } from "../ui/toast";

export function NuevoContratoDialog({
  open,
  onClose,
  idAlumnoInicial,
}: {
  open: boolean;
  onClose: () => void;
  idAlumnoInicial?: string;
}) {
  const { alumnos, alumnoPorId, crearContrato } = useData();
  const { toast } = useToast();
  const idBase = useId();
  const [idAlumno, setIdAlumno] = useState("");
  const [fechaDesde, setFechaDesde] = useState(FECHA_REFERENCIA);
  const [fechaHasta, setFechaHasta] = useState("2027-03-31");
  const [error, setError] = useState<string | null>(null);

  const alumnosOrdenados = [...alumnos].sort((a, b) =>
    a.apellido.localeCompare(b.apellido),
  );

  useEffect(() => {
    if (!open) return;
    setIdAlumno(idAlumnoInicial ?? alumnosOrdenados[0]?.idAlumno ?? "");
    setFechaDesde(FECHA_REFERENCIA);
    setFechaHasta("2027-03-31");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idAlumnoInicial]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!idAlumno) {
      setError("Seleccioná un alumno.");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      setError("Completá ambas fechas.");
      return;
    }
    if (fechaHasta <= fechaDesde) {
      setError("La fecha de fin debe ser posterior a la de inicio.");
      return;
    }

    crearContrato({ idAlumno, fechaDesde, fechaHasta });
    const alumno = alumnoPorId.get(idAlumno);
    toast({
      title: "Contrato creado",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatFecha(fechaDesde)} al ${formatFecha(fechaHasta)}`,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo contrato"
      description="Un alumno puede tener varios contratos a lo largo del tiempo."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          id={`${idBase}-alumno`}
          label="Alumno"
          value={idAlumno}
          required
          disabled={Boolean(idAlumnoInicial)}
          onChange={(event) => {
            setIdAlumno(event.target.value);
            setError(null);
          }}
        >
          {alumnosOrdenados.map((alumno) => (
            <option key={alumno.idAlumno} value={alumno.idAlumno}>
              {alumno.apellido}, {alumno.nombre}
            </option>
          ))}
        </SelectField>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${idBase}-desde`}
            label="Fecha de inicio"
            type="date"
            value={fechaDesde}
            required
            onChange={(event) => {
              setFechaDesde(event.target.value);
              setError(null);
            }}
          />
          <TextField
            id={`${idBase}-hasta`}
            label="Fecha de fin"
            type="date"
            value={fechaHasta}
            required
            error={error ?? undefined}
            onChange={(event) => {
              setFechaHasta(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Crear contrato</Button>
        </div>
      </form>
    </Dialog>
  );
}
