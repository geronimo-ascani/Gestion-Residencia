import { AvisosProvider } from "../avisos-alumno";
import { StudentNotifications } from "./student-notifications";
import { datosPortalAlumno } from "../../lib/portal-alumno";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { STUDENT_NAV } from "../../config/student-navigation";
import { cn } from "../../lib/cn";
import { usuarioActual, cerrarSesion as finalizarSesion } from "../../lib/session";
import { useData } from "../../lib/store";
import { BrandMark } from "../brand";
import { Avatar } from "../ui/avatar";
import { Icon } from "../ui/icons";

export function StudentShell() {
  return <AvisosProvider key={usuarioActual.idUsuario} idUsuario={usuarioActual.idUsuario}><StudentShellContent /></AvisosProvider>;
}

function StudentShellContent() {
  const data = useData();
  const { usuarios } = data;
  const { avisos } = datosPortalAlumno(data, usuarioActual);
  const cuenta = usuarios.find((u) => u.idUsuario === usuarioActual.idUsuario) ?? usuarioActual;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function cerrarSesion() {
    finalizarSesion();
    navigate("/login");
  }

  return (
    <div className="min-h-dvh bg-[#e7eeeb] dark:bg-slate-950">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 bg-brand-900 text-white shadow-sm">
        <div className="border-b border-white/10">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link to="/estudiante" aria-label="Mi residencia · Ir al panel" className="flex min-w-0 items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <BrandMark className="h-8 w-8 shrink-0 text-brand-100" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">Mi residencia</p><p className="text-xs text-slate-300">Portal del alumno</p></div>
            </Link>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <StudentNotifications avisos={avisos} />
              <Link to="/estudiante/perfil" aria-label="Ver mi perfil" className="flex items-center gap-2 rounded p-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Avatar nombre={cuenta.nombre} size="sm" />
                <span className="hidden max-w-48 truncate text-sm sm:block">{cuenta.nombre}</span>
              </Link>
              <button type="button" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión" className="inline-flex items-center gap-2 rounded-md p-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Icon name="logout" className="h-4 w-4" /><span className="hidden lg:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
        <nav aria-label="Módulos del alumno" className="mx-auto grid max-w-7xl grid-cols-2 gap-1.5 px-4 py-3 min-[420px]:grid-cols-3 sm:px-6 md:grid-cols-7 lg:px-8">
          {STUDENT_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/estudiante"} className={({ isActive }) => cn(
              "flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:px-3 lg:text-sm last:col-span-2 min-[420px]:last:col-span-3 md:last:col-span-1",
              (isActive || (item.to === "/estudiante/perfil" && pathname === "/estudiante/cambiar-clave")) ? "bg-white text-brand-900 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}>
              <Icon name={item.icon} className="h-4 w-4 shrink-0" /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
