import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { BackToList } from "../Components/ui/back-to-list";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { LimpiezaIntegrantes } from "../Components/limpieza-integrantes";
import { Button, ButtonLink } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { PageHeader } from "../Components/ui/page-header";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Integrantes del grupo · Gestión de Residencia" }]; }
export default function AlumnosGrupoLimpieza() {
  const { idGrupoLimpieza } = useParams();
  const { grupoPorId, grupoAlumnos, guardarAlumnosGrupo } = useData();
  const grupo = grupoPorId.get(idGrupoLimpieza ?? "");
  const [ids, setIds] = useState(() => grupoAlumnos.filter((a) => a.idGrupoLimpieza === idGrupoLimpieza).map((a) => a.idAlumno));
  const navigate = useNavigate();
  const { toast } = useToast();
  if (!grupo) return <EmptyState icon="cleaning" title="Grupo no encontrado" description="No existe el grupo solicitado." action={<BackToList to="/limpieza" />} />;
  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!grupo) return;
    guardarAlumnosGrupo(grupo.idGrupoLimpieza, ids);
    toast({ title: "Integrantes actualizados", description: `${ids.length} integrantes en ${grupo.nombreDelGrupo}.` });
    navigate(`/limpieza/${grupo.idGrupoLimpieza}`);
  }
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Limpieza" title={`Integrantes · ${grupo.nombreDelGrupo}`} description="Asigná por habitación o elegí alumnos individualmente. Los cambios se aplican al guardar." actions={<ButtonLink to={`/limpieza/${grupo.idGrupoLimpieza}`} variant="outline">Volver al grupo</ButtonLink>} />
    <FormularioConfirmado onSubmit={guardar} className="space-y-6"><LimpiezaIntegrantes seleccionados={ids} onChange={setIds} idGrupo={grupo.idGrupoLimpieza} /><div className="flex justify-end gap-2"><ButtonLink data-descartar to={`/limpieza/${grupo.idGrupoLimpieza}`} variant="outline">Cancelar</ButtonLink><Button type="submit">Guardar integrantes</Button></div></FormularioConfirmado>
  </div>;
}
