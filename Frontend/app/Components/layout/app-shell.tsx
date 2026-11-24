import { useToast } from "../ui/toast";
import { StudentShell } from "./student-shell";
import { useEffect, useId, useRef, useState } from "react";
import {
  Link,
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import { cn } from "../../lib/cn";
import { usuarioActual as sesionActual, cerrarSesion as finalizarSesion } from "../../lib/session";
import { useData } from "../../lib/store";
import { BrandMark } from "../brand";
import { Avatar } from "../ui/avatar";
import { Icon, type IconName } from "../ui/icons";

const GRUPOS_NAV: Array<{
  id: string;
  label: string;
  icon: IconName;
  items: { to: string; label: string; icon: IconName }[];
}> = [
  {
    id: "residentes", label: "Residentes", icon: "users",
    items: [
      { to: "/alumnos", label: "Alumnos", icon: "users" },
      { to: "/reclamos", label: "Reclamos", icon: "contracts" },
      { to: "/contratos", label: "Contratos", icon: "contracts" },
    ],
  },
  {
    id: "residencia", label: "Residencia", icon: "building",
    items: [
      { to: "/habitaciones", label: "Habitaciones", icon: "rooms" },
      { to: "/ambientes", label: "Ambientes", icon: "building" },
      { to: "/limpieza", label: "Limpieza", icon: "cleaning" },
    ],
  },
  {
    id: "administracion", label: "Administración", icon: "settings",
    items: [{ to: "/administracion/administradores", label: "Administradores", icon: "users" }, { to: "/administracion/configuracion-sistema", label: "Configuración del Sistema", icon: "settings" }],
  },
  {
    id: "finanzas", label: "Facturación y pagos", icon: "payments",
    items: [
      { to: "/facturacion", label: "Facturación", icon: "contracts" },
      { to: "/cobros", label: "Cobros", icon: "payments" },
      { to: "/multas", label: "Multas", icon: "fines" },
    ],
  },
];

function grupoDeRuta(pathname: string) {
  return GRUPOS_NAV.find((grupo) => grupo.items.some((item) =>
    pathname === item.to || pathname.startsWith(`${item.to}/`),
  ))?.id ?? null;
}

const ETIQUETAS: Record<string, string> = {
  estudiante: "Mi residencia",
  reclamos: "Reclamos",
  habitacion: "Mi habitación",
  facturas: "Facturas y pagos",
  perfil: "Mi perfil",
  avisos: "Avisos",
  administracion: "Administración",
  administradores: "Administradores",
  parametros: "Configuración del Sistema",
  nuevo: "Nuevo",
  cuenta: "Cuenta de acceso",
  alumnos: "Alumnos",
  habitaciones: "Habitaciones",
  ambientes: "Ambientes",
  contratos: "Contratos",
  facturacion: "Facturación",
  cobros: "Cobros",
  nueva: "Nueva factura",
  registrar: "Registrar cobro",
  multas: "Multas",
  limpieza: "Limpieza",
};

export function AppShell() {
  const [menuMovil, setMenuMovil] = useState(false);
  const [colapsado, setColapsado] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { usuarioAutenticado } = useData();

  useEffect(() => {
    setMenuMovil(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuMovil) return;
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuMovil(false);
      if (event.key === "Tab") {
        const elementos = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []).filter((e) => e.getClientRects().length > 0);
        const primero = elementos[0], ultimo = elementos.at(-1);
        if (event.shiftKey && (document.activeElement === primero || document.activeElement === menuRef.current)) { event.preventDefault(); ultimo?.focus(); }
        else if (!event.shiftKey && (document.activeElement === ultimo || document.activeElement === menuRef.current)) { event.preventDefault(); primero?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
  }, [menuMovil]);

  if (!usuarioAutenticado) return <Navigate to="/login" replace />;
  const esAlumno = usuarioAutenticado.rol === "alumno";
  const rutaAlumno = matchPath("/estudiante/*", location.pathname);
  if (esAlumno && !rutaAlumno) return <Navigate to="/estudiante" replace />;
  if (!esAlumno && rutaAlumno) return <Navigate to="/" replace />;
  if (esAlumno) return <StudentShell />;

  return (
    <div className="min-h-dvh bg-[#e7eeeb] dark:bg-slate-950">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[70] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <aside
        id="navegacion-lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 ease-out lg:block",
          colapsado ? "w-[76px]" : "w-[260px]",
        )}
      >
        <SidebarContent colapsado={colapsado} onExpand={() => setColapsado(false)} />
      </aside>

      {menuMovil ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setMenuMovil(false)}
            aria-hidden="true"
          />
          <div ref={menuRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Navegación principal" className="absolute inset-y-0 left-0 w-[280px] shadow-xl outline-none">
            <button type="button" aria-label="Cerrar menú" onClick={() => setMenuMovil(false)} className="absolute top-4 right-3 z-10 rounded-md p-2 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"><Icon name="close" className="h-5 w-5" /></button>
            <SidebarContent onNavigate={() => setMenuMovil(false)} />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "transition-[padding] duration-200 ease-out",
          colapsado ? "lg:pl-[76px]" : "lg:pl-[260px]",
        )}
      >
        <Topbar
          colapsado={colapsado}
          onToggleColapso={() => setColapsado((previo) => !previo)}
          onOpenMenu={() => setMenuMovil(true)}
        />
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  colapsado = false,
  onNavigate,
  onExpand,
}: {
  colapsado?: boolean;
  onNavigate?: () => void;
  onExpand?: () => void;
}) {
  const { usuarios } = useData();
  const usuarioActual = usuarios.find((u) => u.idUsuario === sesionActual.idUsuario) ?? sesionActual;
  const esAlumno = sesionActual.rol === "alumno";
  const perfil = esAlumno ? "/estudiante/perfil" : `/administracion/administradores/${usuarioActual.idUsuario}`;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const idBase = useId();
  const grupoActivo = grupoDeRuta(pathname);
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(() => grupoDeRuta(pathname));

  useEffect(() => {
    setGrupoAbierto(grupoDeRuta(pathname));
  }, [pathname]);

  const { toast } = useToast();

  async function cerrarSesion() {
    try {
      await finalizarSesion();
      onNavigate?.();
      navigate("/login", { replace: true });
    } catch {
      toast({ title: "No pudimos cerrar la sesión", description: "Volvé a intentar." });
    }
  }

  return (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/10",
          colapsado ? "justify-center px-2" : "gap-2.5 px-5",
        )}
      >
        <BrandMark className="h-8 w-8 shrink-0 text-slate-200" />
        {!colapsado ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Gestión de Residencia</p>
            <p className="text-xs text-slate-400">{esAlumno ? "Portal del alumno" : "Administración"}</p>
          </div>
        ) : null}
      </div>

      <nav
        aria-label="Navegación principal"
        className={cn(
          "flex-1 overflow-y-auto py-4",
          colapsado ? "px-2" : "px-3",
        )}
      >
        <div className="space-y-1">
          <NavLink
            to={esAlumno ? "/estudiante" : "/"}
            end
            onClick={onNavigate}
            title={colapsado ? "Panel" : undefined}
            aria-label={colapsado ? "Panel" : undefined}
            className={({ isActive }) => cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              colapsado && "justify-center px-0",
              isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            )}
          >
            <Icon name="dashboard" className="h-5 w-5 shrink-0" />
            {!colapsado ? <span>{esAlumno ? "Inicio" : "Panel"}</span> : null}
          </NavLink>
          {GRUPOS_NAV.map((grupo) => {
            const abierto = !colapsado && grupoAbierto === grupo.id;
            const activo = grupoActivo === grupo.id;
            const idSubmenu = `${idBase}-${grupo.id}`;
            return (
              <div key={grupo.id}>
                <button
                  type="button"
                  aria-expanded={abierto}
                  aria-controls={idSubmenu}
                  aria-label={colapsado ? grupo.label : undefined}
                  title={colapsado ? grupo.label : undefined}
                  onClick={() => {
                    if (colapsado) onExpand?.();
                    setGrupoAbierto(abierto ? null : grupo.id);
                  }}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                    colapsado && "justify-center px-0",
                    activo ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  {activo ? <span aria-hidden="true" className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r bg-slate-200" /> : null}
                  <Icon name={grupo.icon} className="h-5 w-5 shrink-0" />
                  {!colapsado ? <><span className="flex-1">{grupo.label}</span><Icon name="chevron" className={cn("h-4 w-4 shrink-0 transition-transform", abierto && "rotate-180")} /></> : null}
                </button>
                <div id={idSubmenu} hidden={!abierto}>
                  <div className="my-2 ml-5 space-y-1 border-l border-white/15 pl-3">
                    {grupo.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                          isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                        )}
                      >
                        <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-white/10",
          colapsado ? "p-2" : "p-3",
        )}
      >
        {colapsado ? (
          <div className="mt-2 flex flex-col items-center gap-1 border-t border-white/10 pt-2">
            <span title={`${usuarioActual.nombre} · ${esAlumno ? "Alumno" : "Administración"}`}>
              <Link to={perfil} aria-label="Ver mi perfil"><Avatar nombre={usuarioActual.nombre} size="sm" /></Link>
            </span>
            <button
              type="button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-2">
            <Link to={perfil} aria-label="Ver mi perfil"><Avatar nombre={usuarioActual.nombre} size="sm" /></Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {usuarioActual.nombre}
              </p>
              <p className="truncate text-xs text-slate-400">{esAlumno ? "Alumno" : "Administración"}</p>
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Topbar({
  colapsado,
  onToggleColapso,
  onOpenMenu,
}: {
  colapsado: boolean;
  onToggleColapso: () => void;
  onOpenMenu: () => void;
}) {
  const location = useLocation();
  const esAlumno = sesionActual.rol === "alumno";
  const segmentos = location.pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleColapso}
          aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
          aria-controls="navegacion-lateral"
          aria-expanded={!colapsado}
          title={colapsado ? "Expandir menú" : "Colapsar menú"}
          className="-ml-1 hidden h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:inline-flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Icon
            name="panel"
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              colapsado && "rotate-180",
            )}
          />
        </button>

        <nav
          aria-label="Ubicación"
          className="hidden min-w-0 items-center gap-2 text-sm sm:flex"
        >
          {segmentos.length === 0 ? (
            <span className="font-medium text-slate-900 dark:text-white">
              Panel
            </span>
          ) : (
            <>
              <Link
                to={esAlumno ? "/estudiante" : "/"}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Panel
              </Link>
              {segmentos.map((segmento, indice) => {
                const esUltimo = indice === segmentos.length - 1;
                const etiqueta =
                  ETIQUETAS[segmento] ??
                  (indice > 0 ? "Detalle" : segmento);
                const href = `/${segmentos.slice(0, indice + 1).join("/")}`;

                return (
                  <span
                    key={`${segmento}-${indice}`}
                    className="flex min-w-0 items-center gap-2"
                  >
                    <span aria-hidden="true" className="text-slate-300">
                      /
                    </span>
                    {esUltimo ? (
                      <span className="truncate font-medium text-slate-900 dark:text-white">
                        {etiqueta}
                      </span>
                    ) : (
                      <Link
                        to={href}
                        className="truncate text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        {etiqueta}
                      </Link>
                    )}
                  </span>
                );
              })}
            </>
          )}
        </nav>

      </div>
    </header>
  );
}
