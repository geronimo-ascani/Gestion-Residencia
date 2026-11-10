import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FECHA_REFERENCIA } from "../../lib/config";
import { formatFecha } from "../../lib/format";
import { useData } from "../../lib/store";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
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
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [opcionActiva, setOpcionActiva] = useState(0);
  const [fechaDesde, setFechaDesde] = useState(FECHA_REFERENCIA);
  const [fechaHasta, setFechaHasta] = useState("2027-03-31");
  const [errorAlumno, setErrorAlumno] = useState<string | null>(null);
  const [errorFechas, setErrorFechas] = useState<string | null>(null);

  const busquedaAlumnoDebounceada = useDebouncedValue(busquedaAlumno);
  const busquedaPendiente = busquedaAlumno !== busquedaAlumnoDebounceada;
  const alumnosOrdenados = useMemo(
    () => [...alumnos].sort((a, b) => a.apellido.localeCompare(b.apellido)),
    [alumnos],
  );
  const alumnosFiltrados = useMemo(() => {
    const termino = busquedaAlumnoDebounceada.trim().toLocaleLowerCase();
    if (!termino) return alumnosOrdenados;
    return alumnosOrdenados.filter((alumno) =>
      [alumno.nombre, alumno.apellido, alumno.documento, alumno.correo].some(
        (dato) => dato.toLocaleLowerCase().includes(termino),
      ),
    );
  }, [alumnosOrdenados, busquedaAlumnoDebounceada]);
  const alumnoSeleccionado = alumnos.find((alumno) => alumno.idAlumno === idAlumno);

  useEffect(() => {
    if (!open) return;
    const alumnoInicial = alumnos.find(
      (alumno) => alumno.idAlumno === idAlumnoInicial,
    );
    setIdAlumno(alumnoInicial?.idAlumno ?? "");
    setBusquedaAlumno(
      alumnoInicial ? `${alumnoInicial.apellido}, ${alumnoInicial.nombre}` : "",
    );
    setOpcionesAbiertas(false);
    setOpcionActiva(0);
    setFechaDesde(FECHA_REFERENCIA);
    setFechaHasta("2027-03-31");
    setErrorAlumno(null);
    setErrorFechas(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idAlumnoInicial]);

  function seleccionarAlumno(alumnoId: string) {
    const alumno = alumnos.find((item) => item.idAlumno === alumnoId);
    if (!alumno) return;
    setIdAlumno(alumno.idAlumno);
    setBusquedaAlumno(`${alumno.apellido}, ${alumno.nombre}`);
    setOpcionesAbiertas(false);
    setErrorAlumno(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!idAlumno) {
      setErrorAlumno("Seleccioná un alumno de la lista.");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      setErrorFechas("Completá ambas fechas.");
      return;
    }
    if (fechaHasta <= fechaDesde) {
      setErrorFechas("La fecha de fin debe ser posterior a la de inicio.");
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
        <div
          className="relative"
          onBlur={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              setOpcionesAbiertas(false);
            }
          }}
        >
          <TextField
            id={`${idBase}-alumno`}
            label="Buscar alumno"
            type="search"
            value={busquedaAlumno}
            disabled={Boolean(idAlumnoInicial)}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={opcionesAbiertas}
            aria-controls={`${idBase}-alumnos`}
            aria-activedescendant={
              opcionesAbiertas && alumnosFiltrados[opcionActiva]
                ? `${idBase}-${alumnosFiltrados[opcionActiva].idAlumno}`
                : undefined
            }
            error={errorAlumno ?? undefined}
            onFocus={() => setOpcionesAbiertas(true)}
            onChange={(event) => {
              setBusquedaAlumno(event.target.value);
              setIdAlumno("");
              setOpcionesAbiertas(true);
              setOpcionActiva(0);
              setErrorAlumno(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpcionesAbiertas(true);
                setOpcionActiva((actual) =>
                  Math.min(actual + 1, Math.max(0, alumnosFiltrados.length - 1)),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setOpcionActiva((actual) => Math.max(0, actual - 1));
              } else if (
                event.key === "Enter" &&
                opcionesAbiertas &&
                !busquedaPendiente &&
                alumnosFiltrados.length > 0
              ) {
                event.preventDefault();
                seleccionarAlumno(
                  alumnosFiltrados[
                    Math.min(opcionActiva, alumnosFiltrados.length - 1)
                  ].idAlumno,
                );
              } else if (event.key === "Escape") {
                setOpcionesAbiertas(false);
              }
            }}
            hint={
              alumnoSeleccionado
                ? `Seleccionado: ${alumnoSeleccionado.apellido}, ${alumnoSeleccionado.nombre}`
                : "Buscá por nombre, apellido o documento."
            }
          />
          {opcionesAbiertas && !idAlumnoInicial ? (
            <div
              id={`${idBase}-alumnos`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {busquedaPendiente ? (
                <p role="status" className="px-3 py-2 text-sm text-slate-500">
                  Buscando alumnos...
                </p>
              ) : alumnosFiltrados.length > 0 ? (
                alumnosFiltrados.map((alumno, indice) => (
                  <button
                    key={alumno.idAlumno}
                    id={`${idBase}-${alumno.idAlumno}`}
                    type="button"
                    role="option"
                    aria-selected={alumno.idAlumno === idAlumno}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      indice === opcionActiva
                        ? "bg-brand-50 text-brand-900 dark:bg-brand-900/30 dark:text-brand-100"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setOpcionActiva(indice)}
                    onClick={() => seleccionarAlumno(alumno.idAlumno)}
                  >
                    <span className="block font-medium">
                      {alumno.apellido}, {alumno.nombre}
                    </span>
                    <span className="block text-xs text-slate-500">
                      DNI {alumno.documento} · {alumno.correo}
                    </span>
                  </button>
                ))
              ) : (
                <p role="status" className="px-3 py-2 text-sm text-slate-500">
                  No se encontraron alumnos.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${idBase}-desde`}
            label="Fecha de inicio"
            type="date"
            value={fechaDesde}
            required
            onChange={(event) => {
              setFechaDesde(event.target.value);
              setErrorFechas(null);
            }}
          />
          <TextField
            id={`${idBase}-hasta`}
            label="Fecha de fin"
            type="date"
            value={fechaHasta}
            required
            error={errorFechas ?? undefined}
            onChange={(event) => {
              setFechaHasta(event.target.value);
              setErrorFechas(null);
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
