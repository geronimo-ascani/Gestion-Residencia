import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import { cn } from "../../lib/cn";
import { usuarioActual } from "../../lib/session";
import { BrandMark } from "../brand";
import { Avatar } from "../ui/avatar";
import { Icon, type IconName } from "../ui/icons";

const NAV: Array<{
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}> = [
  { to: "/", label: "Panel", icon: "dashboard", end: true },
  { to: "/alumnos", label: "Alumnos", icon: "users" },
  { to: "/habitaciones", label: "Habitaciones", icon: "rooms" },
  { to: "/contratos", label: "Contratos", icon: "contracts" },
  { to: "/multas", label: "Multas", icon: "fines" },
  { to: "/limpieza", label: "Limpieza", icon: "cleaning" },
];

const ETIQUETAS: Record<string, string> = {
  alumnos: "Alumnos",
  habitaciones: "Habitaciones",
  contratos: "Contratos",
  multas: "Multas",
  limpieza: "Limpieza",
  configuracion: "Configuración",
};

export function AppShell() {
  const [menuMovil, setMenuMovil] = useState(false);
  const [colapsado, setColapsado] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuMovil(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuMovil) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuMovil(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
    };
  }, [menuMovil]);

  return (
    <div className="min-h-dvh bg-slate-100 dark:bg-slate-950">
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
        <SidebarContent colapsado={colapsado} />
      </aside>

      {menuMovil ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setMenuMovil(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-xl">
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
}: {
  colapsado?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();

  function cerrarSesion() {
    onNavigate?.();
    navigate("/login");
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
            <p className="text-xs text-slate-400">Administración</p>
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
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={colapsado ? item.label : undefined}
              aria-label={colapsado ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                  colapsado && "justify-center px-0",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r bg-slate-200"
                    />
                  ) : null}
                  <Icon
                    name={item.icon}
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-slate-100" : "text-slate-500",
                    )}
                  />
                  {!colapsado ? <span>{item.label}</span> : null}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-white/10",
          colapsado ? "p-2" : "p-3",
        )}
      >
        <NavLink
          to="/configuracion"
          onClick={onNavigate}
          title={colapsado ? "Configuración" : undefined}
          aria-label={colapsado ? "Configuración" : undefined}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              colapsado && "justify-center px-0",
              isActive
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                name="settings"
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-slate-100" : "text-slate-500",
                )}
              />
              {!colapsado ? <span>Configuración</span> : null}
            </>
          )}
        </NavLink>

        {colapsado ? (
          <div className="mt-2 flex flex-col items-center gap-1 border-t border-white/10 pt-2">
            <span title={`${usuarioActual.nombre} · Administradora`}>
              <Avatar nombre={usuarioActual.nombre} size="sm" />
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
            <Avatar nombre={usuarioActual.nombre} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {usuarioActual.nombre}
              </p>
              <p className="truncate text-xs text-slate-400">Administradora</p>
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
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
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
                to="/"
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

        <form
          role="search"
          className="ml-auto hidden w-56 md:block lg:w-64"
          onSubmit={(event) => {
            event.preventDefault();
            const termino = busqueda.trim();
            navigate(
              termino
                ? `/alumnos?q=${encodeURIComponent(termino)}`
                : "/alumnos",
            );
            setBusqueda("");
          }}
        >
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar alumno…"
              aria-label="Buscar alumno"
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </form>

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 md:ml-0 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="bell" className="h-5 w-5" />
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-600 ring-2 ring-white dark:ring-slate-900"
          />
        </button>
      </div>
    </header>
  );
}
