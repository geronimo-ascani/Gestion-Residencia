import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import {
  asignacionActiva,
  asignacionesActivas,
} from "../../lib/domain";
import { useData } from "../../lib/store";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { SelectField } from "../ui/select-field";
import { useToast } from "../ui/toast";

export function AsignarHabitacionDialog({
  open,
  onClose,
  idAlumno,
  idHabitacion,
}: {
  open: boolean;
  onClose: () => void;
  idAlumno?: string;
  idHabitacion?: string;
}) {
  const {
    alumnos,
    habitaciones,
    asignaciones,
    alumnoPorId,
    habitacionPorId,
    asignarHabitacion,
  } = useData();
  const { toast } = useToast();
  const idBase = useId();
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activas = asignacionesActivas(asignaciones);

  function habitacionesConCupo(idAlumnoActual: string) {
    const actual = idAlumnoActual
      ? asignacionActiva(asignaciones, idAlumnoActual)?.idHabitacion
      : undefined;

    return habitaciones
      .map((habitacion) => ({
        habitacion,
        ocupadas: activas.filter(
          (asignacion) => asignacion.idHabitacion === habitacion.idHabitacion,
        ).length,
      }))
      .filter(
        ({ habitacion, ocupadas }) =>
          ocupadas < habitacion.capacidadMaxima &&
          habitacion.idHabitacion !== actual,
      );
  }

  const alumnosOrdenados = [...alumnos].sort((a, b) =>
    a.apellido.localeCompare(b.apellido),
  );

  const alumnosDisponibles = alumnosOrdenados.filter((alumno) => {
    if (!idHabitacion) return true;
    return (
      asignacionActiva(asignaciones, alumno.idAlumno)?.idHabitacion !==
      idHabitacion
    );
  });

  const disponibles = habitacionesConCupo(alumnoSeleccionado);

  useEffect(() => {
    if (!open) return;

    const alumnoElegido =
      idAlumno ?? alumnosDisponibles[0]?.idAlumno ?? "";
    const opciones = habitacionesConCupo(alumnoElegido);

    setAlumnoSeleccionado(alumnoElegido);
    setHabitacionSeleccionada(
      idHabitacion ?? opciones[0]?.habitacion.idHabitacion ?? "",
    );
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idAlumno, idHabitacion]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!alumnoSeleccionado) {
      setError("Seleccioná un alumno.");
      return;
    }
    if (!habitacionSeleccionada) {
      setError("No hay habitaciones con cupo disponible.");
      return;
    }

    const habitacion = habitacionPorId.get(habitacionSeleccionada);
    const alumno = alumnoPorId.get(alumnoSeleccionado);
    const ocupadas = activas.filter(
      (asignacion) =>
        asignacion.idHabitacion === habitacionSeleccionada,
    ).length;

    if (habitacion && ocupadas >= habitacion.capacidadMaxima) {
      setError("La habitación seleccionada está completa.");
      return;
    }

    asignarHabitacion(alumnoSeleccionado, habitacionSeleccionada);
    toast({
      title: "Habitación asignada",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · Habitación ${habitacion?.numeroHabitacion ?? habitacionSeleccionada}`,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Asignar habitación"
      description="Si el alumno ya tenía una habitación, la asignación anterior se cierra con la fecha de hoy."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!idAlumno ? (
          <SelectField
            id={`${idBase}-alumno`}
            label="Alumno"
            value={alumnoSeleccionado}
            required
            onChange={(event) => {
              const nuevoAlumno = event.target.value;
              setAlumnoSeleccionado(nuevoAlumno);
              const opciones = habitacionesConCupo(nuevoAlumno);
              setHabitacionSeleccionada((previa) =>
                opciones.some(
                  (opcion) =>
                    opcion.habitacion.idHabitacion === previa,
                )
                  ? previa
                  : (opciones[0]?.habitacion.idHabitacion ?? ""),
              );
              setError(null);
            }}
          >
            {alumnosDisponibles.map((alumno) => {
              const actual = asignacionActiva(asignaciones, alumno.idAlumno);
              const habitacionActual = actual
                ? habitacionPorId.get(actual.idHabitacion)
                : undefined;
              return (
                <option key={alumno.idAlumno} value={alumno.idAlumno}>
                  {alumno.apellido}, {alumno.nombre}
                  {habitacionActual
                    ? ` · Hab. ${habitacionActual.numeroHabitacion}`
                    : " · Sin habitación"}
                </option>
              );
            })}
          </SelectField>
        ) : (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            Alumno:{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {alumnoPorId.get(alumnoSeleccionado)
                ? `${alumnoPorId.get(alumnoSeleccionado)?.nombre} ${alumnoPorId.get(alumnoSeleccionado)?.apellido}`
                : "—"}
            </span>
          </p>
        )}

        {!idHabitacion ? (
          disponibles.length > 0 ? (
            <SelectField
              id={`${idBase}-habitacion`}
              label="Habitación con cupo"
              value={habitacionSeleccionada}
              required
              onChange={(event) => {
                setHabitacionSeleccionada(event.target.value);
                setError(null);
              }}
            >
              {disponibles.map(({ habitacion, ocupadas }) => (
                <option
                  key={habitacion.idHabitacion}
                  value={habitacion.idHabitacion}
                >
                  Hab. {habitacion.numeroHabitacion} · {ocupadas}/
                  {habitacion.capacidadMaxima} ocupadas ·{" "}
                  {habitacion.descripcion}
                </option>
              ))}
            </SelectField>
          ) : (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              No hay habitaciones con cupo disponible.
            </p>
          )
        ) : (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            Habitación:{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {habitacionPorId.get(idHabitacion)?.numeroHabitacion ??
                idHabitacion}
            </span>
          </p>
        )}

        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!idHabitacion && disponibles.length === 0}
          >
            Asignar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
