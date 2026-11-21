import { prisma } from "../config/database.js";

async function main() {
  const counts = {
    roles: await prisma.rol.count(),
    usuarios: await prisma.usuario.count(),
    alumnos: await prisma.alumno.count(),
    contactos: await prisma.contactoEmergencia.count(),
    habitaciones: await prisma.habitacion.count(),
    asignaciones: await prisma.habitacionAlumno.count(),
    contratos: await prisma.contrato.count(),
    facturas: await prisma.factura.count(),
    detalles: await prisma.detalleFactura.count(),
    pagos: await prisma.pago.count(),
    multas: await prisma.multa.count(),
    grupos: await prisma.grupoDeLimpieza.count(),
    ambientes: await prisma.ambiente.count(),
    equipamientos: await prisma.equipamientoAmbiente.count(),
    tareas: await prisma.tareaLimpieza.count(),
    parametros: await prisma.parametroSistema.count(),
    catalogos: await prisma.opcionCatalogo.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
