import { useRef, useState } from "react";
import type { ComponentProps } from "react";
import { ConfirmDialog } from "./confirm-dialog";

type Confirmacion = { tipo: "guardar" | "descartar"; ejecutar: () => void };

export function FormularioConfirmado({
  confirmarGuardado = true,
  cambios,
  onSubmit,
  children,
  ...props
}: ComponentProps<"form"> & { confirmarGuardado?: boolean; cambios?: boolean }) {
  const modificado = useRef(false);
  const autorizado = useRef(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const descartar = confirmacion?.tipo === "descartar";

  return <>
    <form {...props} onChangeCapture={() => { modificado.current = true; }} onClickCapture={(event) => {
      if (autorizado.current || !(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("[data-descartar], [data-modifica-formulario]");
      if (!control || !event.currentTarget.contains(control)) return;
      if (control.hasAttribute("data-modifica-formulario")) modificado.current = true;
      if (!control.hasAttribute("data-descartar") || !(cambios ?? modificado.current)) return;
      event.preventDefault();
      event.stopPropagation();
      setConfirmacion({ tipo: "descartar", ejecutar: () => control.click() });
    }} onSubmit={(event) => {
      if (!confirmarGuardado || autorizado.current) {
        onSubmit?.(event);
        return;
      }
      event.preventDefault();
      const formulario = event.currentTarget;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      setConfirmacion({
        tipo: "guardar",
        ejecutar: () => formulario.requestSubmit(submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter : undefined),
      });
    }}>
      {children}
    </form>
    <ConfirmDialog open={confirmacion !== null} onClose={() => setConfirmacion(null)}
      title={descartar ? "¿Descartar los cambios?" : "¿Guardar los cambios?"}
      description={descartar ? "Se perderán los cambios de este formulario." : "Se aplicarán los cambios ingresados."}
      confirmLabel={descartar ? "Descartar cambios" : "Guardar cambios"}
      cancelLabel={descartar ? "Seguir editando" : "Revisar cambios"}
      tone={descartar ? "danger" : "brand"}
      onConfirm={() => {
        autorizado.current = true;
        try { confirmacion?.ejecutar(); }
        finally { autorizado.current = false; }
      }} />
  </>;
}
