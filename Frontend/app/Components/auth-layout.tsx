import type { ReactNode } from "react";
import { BrandMark } from "./brand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-slate-50 dark:bg-slate-950 lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark className="h-8 w-8 text-brand-700 dark:text-brand-300" />
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              Gestión de Residencia
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="relative flex items-center gap-2.5">
        <BrandMark className="h-9 w-9 text-slate-200" />
        <span className="text-lg font-semibold">Gestión de Residencia</span>
      </div>

      <div className="relative max-w-md border-l-2 border-slate-500/60 pl-6">
        <h2 className="text-3xl leading-tight font-semibold">
          Todo el edificio, organizado en un solo lugar.
        </h2>
        <p className="mt-4 text-slate-300">
          Administra residentes, habitaciones y pagos desde un panel simple y
          seguro.
        </p>
      </div>

      <p className="relative text-sm text-slate-400">
        © {new Date().getFullYear()} Gestión de Residencia
      </p>
    </aside>
  );
}

