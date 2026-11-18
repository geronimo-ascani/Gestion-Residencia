import { useParams } from "react-router";
import { ContratoForm } from "./contratos.nuevo";
import { BackToList } from "../Components/ui/back-to-list";
import { PageHeader } from "../Components/ui/page-header";
import { titularContratoEditable } from "../lib/gestiones";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Modificar contrato · Gestión de Residencia" }];
}

export default function EditarContrato() {
  const { idContrato } = useParams();
  const data = useData();
  const contrato = data.contratos.find((c) => c.idContrato === idContrato);
  if (!contrato) return <PageHeader eyebrow="Contratos" title="Contrato no encontrado" actions={<BackToList to="/contratos" />} />;
  return <ContratoForm key={contrato.idContrato} contrato={contrato} titularEditable={titularContratoEditable(data, contrato)} />;
}
