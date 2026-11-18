import { FormularioConfirmado } from "./ui/formulario-confirmado";
import { useState } from "react";
import { useData } from "../lib/store";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { TextField } from "./ui/text-field";
import { useToast } from "./ui/toast";
import type { Contrato } from "../lib/types";
export function AjustarContrato({ contrato }: { contrato: Contrato }) {
 const { ajustarImporteContrato } = useData(); const { toast } = useToast(); const [open,setOpen] = useState(false); const [monto,setMonto] = useState(""); const [error,setError] = useState("");
 return <><Button variant="outline" onClick={() => { setMonto(String(contrato.montoMensual ?? "")); setError(""); setOpen(true); }}>Modificar valor del contrato</Button><Dialog open={open} onClose={() => setOpen(false)} title="Modificar valor del contrato" description="Se usará al emitir nuevas facturas de este contrato. Las facturas ya emitidas conservan su importe."><FormularioConfirmado className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); try { ajustarImporteContrato(contrato.idContrato, Number(monto)); setOpen(false); toast({ title: "Valor del contrato actualizado" }); } catch(err) { setError(err instanceof Error ? err.message : "No se pudo actualizar."); } }}><TextField id="ajuste-cuota" label="Nuevo importe mensual (ARS)" type="number" min="0.01" step="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} />{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" data-descartar onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Guardar importe</Button></div></FormularioConfirmado></Dialog></>;
}
