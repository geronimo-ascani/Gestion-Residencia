import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-slate-50 dark:bg-slate-950 lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark className="h-8 w-8 text-brand-600 dark:text-brand-400" />
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-700/40 blur-3xl"
      />

      <div className="relative flex items-center gap-2.5">
        <BrandMark className="h-9 w-9 text-brand-300" />
        <span className="text-lg font-semibold">Gestión de Residencia</span>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-3xl leading-tight font-semibold">
          Todo el edificio, organizado en un solo lugar.
        </h2>
        <p className="mt-4 text-brand-100/80">
          Administra residentes, habitaciones y pagos desde un panel simple y
          seguro.
        </p>
      </div>

      <p className="relative text-sm text-brand-200">
        © {new Date().getFullYear()} Gestión de Residencia
      </p>
    </aside>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 21V9.5l9-6 9 6V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 21v-6h6v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
