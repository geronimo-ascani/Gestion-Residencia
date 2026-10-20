import { useEffect, useRef, useState } from "react";
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
  { to: "/cuotas", label: "Cuotas", icon: "payments" },
  { to: "/multas", label: "Multas", icon: "fines" },
  { to: "/limpieza", label: "Limpieza", icon: "cleaning" },
];

const ETIQUETAS: Record<string, string> = {
  alumnos: "Alumnos",
  habitaciones: "Habitaciones",
  contratos: "Contratos",
  cuotas: "Cuotas",
  multas: "Multas",
  limpieza: "Limpieza",
  configuracion: "Configuración",
};

export function AppShell() {
  const [menuMovil, setMenuMovil] = useState(false);
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
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">
        <SidebarContent />
      </aside>

      {menuMovil ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMenuMovil(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl">
            <SidebarContent onNavigate={() => setMenuMovil(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <Topbar onOpenMenu={() => setMenuMovil(true)} />
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <BrandMark className="h-8 w-8 shrink-0 text-brand-300" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Gestión de Residencia</p>
          <p className="text-xs text-brand-200/80">Administración</p>
        </div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-brand-100/75 hover:bg-white/5 hover:text-white",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r bg-brand-300"
                  />
                ) : null}
                <Icon
                  name={item.icon}
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-brand-300" : "text-brand-200/70",
                  )}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <NavLink
          to="/configuracion"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-brand-100/75 hover:bg-white/5 hover:text-white",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                name="settings"
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-brand-300" : "text-brand-200/70",
                )}
              />
              <span>Configuración</span>
            </>
          )}
        </NavLink>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            navigate("/login");
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Icon name="logout" className="h-5 w-5 shrink-0 text-brand-200/70" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const segmentos = location.pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="menu" className="h-5 w-5" />
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
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </form>

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:ml-0 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="bell" className="h-5 w-5" />
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-950"
          />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        contenedor.current &&
        !contenedor.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Avatar nombre={usuarioActual.nombre} size="sm" />
        <span className="hidden sm:block">
          <span className="block max-w-[140px] truncate text-sm font-medium text-slate-900 dark:text-white">
            {usuarioActual.nombre}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            Administradora
          </span>
        </span>
        <Icon
          name="chevron"
          className={cn(
            "hidden h-4 w-4 text-slate-400 transition-transform sm:block",
            abierto && "rotate-180",
          )}
        />
      </button>

      {abierto ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {usuarioActual.nombre}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {usuarioActual.correo}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              navigate("/configuracion");
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Icon name="settings" className="h-4 w-4 text-slate-400" />
            Configuración
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              navigate("/login");
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Icon name="logout" className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
