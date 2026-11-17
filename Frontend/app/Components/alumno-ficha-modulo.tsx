import type { ReactNode } from "react";
import { MODULOS_ALUMNO, type ModuloAlumno } from "../lib/modulos-alumno";
import { ButtonLink } from "./ui/button";

export function AlumnoFichaModulo({
  modulo,
  search,
  children,
}: {
  modulo: ModuloAlumno;
  search: string;
  children: ReactNode;
}) {
  const titulo = MODULOS_ALUMNO[modulo];
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{titulo}</h3>
        <ButtonLink
          to={{ pathname: `editar/${modulo}`, search }}
          size="sm"
          variant="outline"
          aria-label={`Editar ${titulo.toLowerCase()}`}
        >
          Editar
        </ButtonLink>
      </div>
      {children}
    </section>
  );
}

export function DatosModulo({ campos }: { campos: Array<[string, string | number | undefined]> }) {
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      {campos.map(([etiqueta, valor]) => (
        <div key={etiqueta}>
          <dt className="text-xs text-slate-500">{etiqueta}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900 dark:text-white">
            {valor === undefined || valor === "" ? "Sin registrar" : valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
