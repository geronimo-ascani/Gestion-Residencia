import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { datosPortalAlumno } from "../lib/portal-alumno";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { Icon } from "./ui/icons";

export type AvisoAlumno = ReturnType<typeof datosPortalAlumno>["avisos"][number];

function versionAviso(aviso: AvisoAlumno) {
  return JSON.stringify([aviso.id, aviso.titulo, aviso.detalle, aviso.to]);
}

const LecturaContext = createContext<{
  estaLeido: (aviso: AvisoAlumno) => boolean;
  marcarLeidos: (avisos: AvisoAlumno[]) => void;
} | null>(null);

export function AvisosProvider({ idUsuario, children }: { idUsuario: string; children: ReactNode }) {
  const clave = `residencia-avisos-leidos-v1:${idUsuario}`;
  const [leidos, setLeidos] = useState<string[]>(() => {
    try {
      const guardados: unknown = JSON.parse(localStorage.getItem(clave) ?? "[]");
      return Array.isArray(guardados) ? guardados.filter((valor): valor is string => typeof valor === "string") : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(clave, JSON.stringify(leidos)); } catch { /* La lectura sigue funcionando si el almacenamiento está deshabilitado. */ }
  }, [clave, leidos]);

  return <LecturaContext.Provider value={{
    estaLeido: (aviso) => leidos.includes(versionAviso(aviso)),
    marcarLeidos: (avisos) => setLeidos((previos) => [...new Set([...previos, ...avisos.map(versionAviso)])]),
  }}>{children}</LecturaContext.Provider>;
}

export function useAvisosLectura() {
  const contexto = useContext(LecturaContext);
  if (!contexto) throw new Error("La lectura de avisos requiere AvisosProvider.");
  return contexto;
}

export function AvisosAlumno({ avisos, mostrarAcciones = false }: { avisos: AvisoAlumno[]; mostrarAcciones?: boolean }) {
  const { estaLeido, marcarLeidos } = useAvisosLectura();
  const sinLeer = avisos.filter((aviso) => !estaLeido(aviso));

  return <div className="space-y-4">
    {mostrarAcciones && avisos.length ? <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">{sinLeer.length} {sinLeer.length === 1 ? "aviso sin leer" : "avisos sin leer"} · {avisos.length} en total</p>
      <Button variant="outline" size="sm" disabled={!sinLeer.length} onClick={() => marcarLeidos(avisos)}>Marcar todos como leídos</Button>
    </div> : null}
    {avisos.length ? <ul className="space-y-3">{avisos.map((aviso) => {
      const leido = estaLeido(aviso);
      return <li key={aviso.id} id={`aviso-${aviso.id}`} className={`scroll-mt-64 rounded-2xl border p-5 md:scroll-mt-40 ${leido ? "border-slate-200 dark:border-slate-700" : "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-slate-800"}`}>
        <div className="flex items-start gap-3">
          <Icon name="bell" className="mt-0.5 h-10 w-10 shrink-0 rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{aviso.titulo}</h3><Badge variant={leido ? "neutral" : "brand"}>{leido ? "Leído" : "Sin leer"}</Badge></div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{aviso.detalle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Link to={aviso.to} onClick={() => marcarLeidos([aviso])} className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300">Ver detalle <Icon name="arrow" className="h-4 w-4" /></Link>
              {mostrarAcciones && !leido ? <button type="button" onClick={() => marcarLeidos([aviso])} className="rounded text-sm text-slate-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300">Marcar como leído</button> : null}
            </div>
          </div>
        </div>
      </li>;
    })}</ul> : <EmptyState icon="check" title="No tenés avisos pendientes" description="Acá aparecerán tus vencimientos y asignaciones pendientes." />}
  </div>;
}
