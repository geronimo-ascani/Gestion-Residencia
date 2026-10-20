import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "./icons";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: {
    title: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const estilos: Record<ToastVariant, { icon: "check" | "alert" | "bell"; clase: string }> = {
  success: {
    icon: "check",
    clase:
      "bg-slate-100 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400",
  },
  error: {
    icon: "alert",
    clase: "bg-slate-100 text-red-700 dark:bg-slate-800 dark:text-red-400",
  },
  info: {
    icon: "bell",
    clase: "bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-400",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((previo) => previo.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>((input) => {
    idRef.current += 1;
    const id = idRef.current;
    setItems((previo) => [
      ...previo,
      {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "success",
      },
    ]);
    const timer = window.setTimeout(() => dismiss(id), 4500);
    timers.current.push(timer);
  }, [dismiss]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {items.map((item) => {
          const estilo = estilos[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    estilo.clase,
                  )}
                >
                  <Icon name={estilo.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Cerrar notificación"
                  className="-m-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return contexto;
}
