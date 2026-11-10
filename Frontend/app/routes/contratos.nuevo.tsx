import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { contratosSuperpuestos, sumarDia } from "../lib/domain";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

export function meta() {
  return [{ title: "Nuevo contrato · Gestión de Residencia" }];
}

export default function NuevoContrato() {
  const { alumnos, alumnoPorId, contratos, crearContrato } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idBase = useId();
  const alumnoInicial = searchParams.get("alumno") ?? "";
  const fechaDesdeInicial = searchParams.get("desde") ?? FECHA_REFERENCIA;
  const [idAlumno, setIdAlumno] = useState(alumnoInicial);
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [opcionActiva, setOpcionActiva] = useState(0);
  const [fechaDesde, setFechaDesde] = useState(fechaDesdeInicial);
  const [fechaHasta, setFechaHasta] = useState(sumarDia(fechaDesdeInicial, 365));
  const [errorAlumno, setErrorAlumno] = useState<string | null>(null);
  const [errorFechas, setErrorFechas] = useState<string | null>(null);

  const busquedaAlumnoDebounceada = useDebouncedValue(busquedaAlumno);
  const busquedaPendiente = busquedaAlumno !== busquedaAlumnoDebounceada;
  const alumnoPrefijado = alumnos.some(
    (alumno) => alumno.idAlumno === alumnoInicial,
  );
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

    if (contratosSuperpuestos(contratos, { idAlumno, fechaDesde, fechaHasta })) {
      setErrorFechas("Las fechas se superponen con otro contrato del alumno.");
      return;
    }

    crearContrato({ idAlumno, fechaDesde, fechaHasta });
    const alumno = alumnoPorId.get(idAlumno);
    toast({
      title: "Contrato creado",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatFecha(fechaDesde)} al ${formatFecha(fechaHasta)}`,
    });
    navigate("/contratos");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Contratos"
        title="Nuevo contrato"
        description="Definí el titular y el período de vigencia."
        actions={
          <Link to="/contratos">
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al listado
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div
          className="relative max-w-xl"
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
            disabled={alumnoPrefijado}
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
          {opcionesAbiertas ? (
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

        <div className="grid max-w-xl gap-5 sm:grid-cols-2">
          <TextField
            id={`${idBase}-desde`}
            label="Fecha de inicio"
            type="date"
            value={fechaDesde}
            required
            error={errorFechas ?? undefined}
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
            onChange={(event) => {
              setFechaHasta(event.target.value);
              setErrorFechas(null);
            }}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to="/contratos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            Crear contrato
          </Button>
        </div>
      </form>
    </div>
  );
}