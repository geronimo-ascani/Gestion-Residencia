import { useParams } from "react-router";
import { PortalLayout } from "../layouts/PortalLayout";
export default function Portal() { const { role } = useParams(); if (role !== "admin" && role !== "estudiante") throw new Response("Página no encontrada", { status: 404 }); return <PortalLayout role={role} />; }
