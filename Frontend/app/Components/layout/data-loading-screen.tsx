import { BrandMark } from "../brand";

export function DataLoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#e7eeeb] p-6 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-xl backdrop-blur-md sm:p-10 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="relative flex items-center justify-center">
          <svg
            className="h-16 w-16 animate-spin text-brand-700 dark:text-brand-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div className="absolute flex items-center justify-center">
            <BrandMark className="h-8 w-8 text-brand-700 dark:text-brand-400" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cargando residencia...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sincronizando información y permisos</p>
        </div>
      </div>
    </div>
  );
}

export function DataErrorScreen({ error }: { error: string }) {
  return (
    <main className="mx-auto max-w-xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        No pudimos abrir la residencia
      </h1>
      <p role="alert" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {error}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}

export function ErrorGuardadoBanner() {
  return (
    <div
      role="alert"
      className="relative z-50 border-b border-red-200 bg-red-50 p-4 text-center text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
    >
      No se pudieron guardar los últimos cambios en el servidor. Recargá la página para comprobar el estado actual.
    </div>
  );
}
