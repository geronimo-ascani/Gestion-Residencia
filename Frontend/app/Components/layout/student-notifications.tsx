import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAvisosLectura } from "../avisos-alumno";
import type { AvisoAlumno } from "../avisos-alumno";
import { Icon } from "../ui/icons";

export function StudentNotifications({ avisos }: { avisos: AvisoAlumno[] }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const location = useLocation();
  const { estaLeido, marcarLeidos } = useAvisosLectura();
  const sinLeer = avisos.filter((aviso) => !estaLeido(aviso));

  useEffect(() => { setAbierto(false); }, [location.pathname, location.hash]);
  useEffect(() => {
    if (!abierto) return;
    function cerrarFuera(event: PointerEvent) {
      if (event.target instanceof Node && !contenedor.current?.contains(event.target)) setAbierto(false);
    }
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setAbierto(false); boton.current?.focus(); }
    }
    document.addEventListener("pointerdown", cerrarFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  return <div ref={contenedor} className="relative" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setAbierto(false);
  }}>
    <button ref={boton} type="button" aria-label={`Notificaciones: ${sinLeer.length} sin leer`} title="Notificaciones" aria-expanded={abierto} aria-controls={panelId}
      onClick={() => setAbierto((previo) => !previo)} className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <Icon name="bell" className="h-5 w-5" />
      {sinLeer.length ? <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{sinLeer.length > 99 ? "99+" : sinLeer.length}</span> : null}
    </button>
    {abierto ? <section id={panelId} aria-label="Notificaciones sin leer" className="fixed top-[72px] right-4 left-4 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-3 sm:w-96 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-semibold">Notificaciones</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sinLeer.length} {sinLeer.length === 1 ? "notificación sin leer" : "notificaciones sin leer"}</p><button type="button" disabled={!sinLeer.length} onClick={() => marcarLeidos(avisos)} className="mt-2 rounded text-xs font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-default disabled:opacity-40 disabled:no-underline dark:text-brand-300">Marcar todas como leídas</button></div>
      {sinLeer.length ? <ul className="max-h-[min(360px,50dvh)] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {sinLeer.slice(0, 5).map((aviso) => <li key={aviso.id}>
          <Link to={`/estudiante/avisos#aviso-${aviso.id}`} onClick={() => { marcarLeidos([aviso]); setAbierto(false); }} className="flex items-start gap-3 px-4 py-3 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:hover:bg-slate-800">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
            <div><h3 className="text-sm font-medium">{aviso.titulo}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{aviso.detalle}</p></div>
          </Link>
        </li>)}
      </ul> : <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Estás al día. No tenés notificaciones sin leer.</p>}
      <Link to="/estudiante/avisos" onClick={() => setAbierto(false)} className="flex items-center justify-center gap-2 border-t border-slate-200 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:border-slate-700 dark:text-brand-300 dark:hover:bg-slate-800">Ver todas las notificaciones <Icon name="arrow" className="h-4 w-4" /></Link>
    </section> : null}
  </div>;
}
