import { administracionService } from "../services/administracion.service.js";
import { prisma } from "../config/database.js";

async function main() {
  const estado = await administracionService.getEstadoCompleto();
  console.log("Keys in estado:", Object.keys(estado));
  console.log("Counts in estado:", {
    alumnos: estado.alumnos.length,
    habitaciones: estado.habitaciones.length,
    asignaciones: estado.asignaciones.length,
    contratos: estado.contratos.length,
    facturas: estado.facturas.length,
    pagos: estado.pagos.length,
    multas: estado.multas.length,
    grupos: estado.grupos.length,
    grupoAlumnos: estado.grupoAlumnos.length,
    ambientes: estado.ambientes.length,
    usuarios: estado.usuarios.length,
    tareasLimpieza: estado.tareasLimpieza.length,
    carreras: estado.carreras.length,
    vinculos: estado.vinculos.length,
    parametros: Object.keys(estado.parametros).length,
  });
  console.log("Primer alumno:", estado.alumnos[0]?.nombre, estado.alumnos[0]?.apellido, estado.alumnos[0]?.correo);
  console.log("Primer contrato:", estado.contratos[0]);
  console.log("Primera habitacion:", estado.habitaciones[0]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
