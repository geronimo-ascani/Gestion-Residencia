import type { Alumno, Contrato, DataState, Habitacion, HabitacionAlumno } from "../types";
import { usuarioActual } from "../session";

const CAPACIDADES = [2, 2, 4, 4, 5] as const;

const CARRERAS = [
  "Ingeniería en Sistemas de Información",
  "Ingeniería Industrial",
  "Licenciado en Administración Rural",
] as const;

// Nombre, apellido, habitación, carrera, localidad y código postal de origen.
const RESIDENTES = [
  ["Lucía", "Fernández", 1, 0, "Pehuajó", "6450"],
  ["Martina", "López", 1, 1, "Carlos Casares", "6530"],
  ["Tomás", "Gómez", 2, 0, "General Villegas", "6230"],
  ["Mateo", "Rodríguez", 2, 2, "Rivadavia", "6237"],
  ["Valentina", "Martínez", 3, 1, "Daireaux", "6555"],
  ["Camila", "Pérez", 3, 0, "Bolívar", "6550"],
  ["Sofía", "Romero", 3, 2, "Pellegrini", "6346"],
  ["Joaquín", "Díaz", 4, 0, "Salliqueló", "6339"],
  ["Nicolás", "Álvarez", 4, 1, "Tres Lomas", "6409"],
  ["Santiago", "Torres", 4, 2, "Guaminí", "6435"],
  ["Benjamín", "Ruiz", 4, 0, "Pehuajó", "6450"],
  ["Emilia", "Sosa", 5, 1, "Carlos Tejedor", "6455"],
  ["Julieta", "Acosta", 5, 2, "Daireaux", "6555"],
  ["Catalina", "Medina", 5, 0, "General Villegas", "6230"],
] as const;

function pad(numero: number): string {
  return String(numero).padStart(2, "0");
}

/** Inventario real con personas y movimientos ficticios para probar el prototipo. */
export function createInitialData(): DataState {
  const habitaciones: Habitacion[] = CAPACIDADES.map((capacidad, indice) => ({
    idHabitacion: `H${indice + 1}`,
    numeroHabitacion: String(indice + 1),
    pisoHabitacion: 0,
    capacidadMaxima: capacidad,
    descripcion: `Habitación para ${capacidad} personas en planta baja.`,
  }));

  const alumnos: Alumno[] = RESIDENTES.map(
    ([nombre, apellido, , carrera, localidad, codigoPostal], indice) => ({
      idAlumno: `A${pad(indice + 1)}`,
      nombre,
      apellido,
      telefono: `2392 5551${pad(indice + 1)}`,
      correo: `alumno${pad(indice + 1)}@example.com`,
      documento: String(46_000_001 + indice),
      estado: "activo",
      fechaNacimiento: `${2003 + (indice % 4)}-${pad(1 + (indice % 12))}-${pad(5 + indice)}`,
      nacionalidad: "Argentina",
      domicilio: `Calle de ejemplo ${100 + indice * 25}`,
      localidad,
      provincia: "Buenos Aires",
      codigoPostal,
      institucion: "UTN · Facultad Regional Trenque Lauquen",
      carrera: CARRERAS[carrera],
      anioCursado: `${1 + (indice % 4)}° año`,
      cantidadMateriasCursadas: 6 + (indice % 4) * 6,
      legajo: `2026-${pad(indice + 1)}`,
      contactosEmergencia: [
        { nombre: `Laura ${apellido}`, vinculo: "Madre", telefono: `2392 5552${pad(indice + 1)}` },
        { nombre: `Sergio ${apellido}`, vinculo: "Padre", telefono: `2392 5553${pad(indice + 1)}` },
      ],
      observaciones: "Ficha ficticia para pruebas del sistema. No corresponde a una persona real.",
    }),
  );

  const contratos: Contrato[] = alumnos.map((alumno, indice) => ({
    idContrato: `C${pad(indice + 1)}`,
    idAlumno: alumno.idAlumno,
    fechaDesde: "2026-03-01",
    fechaHasta: indice < 3 ? "2026-11-10" : "2027-02-28",
  }));

  // Un caso de renovación y otro de reingreso, sin superponer contratos.
  contratos.push(
    { idContrato: "C15", idAlumno: "A01", fechaDesde: "2025-03-01", fechaHasta: "2026-02-28" },
    {
      idContrato: "C16",
      idAlumno: "A02",
      fechaDesde: "2025-03-01",
      fechaHasta: "2026-02-28",
      fechaCancelacion: "2025-10-01",
      motivoCancelacion: "Interrupción de la estadía por motivos personales (ejemplo).",
    },
  );

  const asignaciones: HabitacionAlumno[] = RESIDENTES.map(([, , habitacion], indice) => ({
    idAlumno: alumnos[indice].idAlumno,
    idHabitacion: `H${habitacion}`,
    fechaDesde: "2026-03-01",
    fechaHasta: null,
  }));
  asignaciones.push(
    { idAlumno: "A01", idHabitacion: "H3", fechaDesde: "2025-03-01", fechaHasta: "2026-03-01" },
    { idAlumno: "A02", idHabitacion: "H1", fechaDesde: "2025-03-01", fechaHasta: "2025-10-01" },
  );

  return {
    habitaciones,
    alumnos,
    asignaciones,
    contratos,
    pagos: alumnos.flatMap((alumno, indice) => [
      {
        idPago: `P${pad(indice * 2 + 1)}`,
        idAlumno: alumno.idAlumno,
        monto: 45_000,
        fecha: "2026-09-05",
        concepto: "Residencia · Septiembre 2026",
      },
      {
        idPago: `P${pad(indice * 2 + 2)}`,
        idAlumno: alumno.idAlumno,
        monto: 45_000,
        fecha: `2026-10-${pad(1 + indice)}`,
        concepto: "Residencia · Octubre 2026",
      },
    ]),
    multas: [
      { idMulta: "M01", idAlumno: "A03", monto: 5_000, fechaEmision: "2026-10-01", fechaVence: "2026-10-15", estado: "pendiente", fechaPago: null },
      { idMulta: "M02", idAlumno: "A08", monto: 4_000, fechaEmision: "2026-10-15", fechaVence: "2026-10-30", estado: "pendiente", fechaPago: null },
      { idMulta: "M03", idAlumno: "A12", monto: 3_000, fechaEmision: "2026-09-10", fechaVence: "2026-09-25", estado: "pagada", fechaPago: "2026-09-20" },
    ],
    grupos: habitaciones.map((habitacion) => ({
      idGrupoLimpieza: `G${habitacion.numeroHabitacion}`,
      nombreDelGrupo: `Habitación ${habitacion.numeroHabitacion}`,
    })),
    grupoAlumnos: RESIDENTES.map(([, , habitacion], indice) => ({
      idGrupoLimpieza: `G${habitacion}`,
      idAlumno: alumnos[indice].idAlumno,
    })),
    ambientes: habitaciones.map((habitacion) => ({
      idAmbiente: `AM${habitacion.numeroHabitacion}`,
      ambiente: `Habitación ${habitacion.numeroHabitacion}`,
      tareas: "Barrer, limpiar el piso, ordenar los espacios compartidos y retirar los residuos.",
    })),
    grupoAmbientes: habitaciones.map((habitacion) => ({
      idGrupoLimpieza: `G${habitacion.numeroHabitacion}`,
      idAmbiente: `AM${habitacion.numeroHabitacion}`,
      fechaDesde: "2026-03-01",
      fechaHasta: null,
    })),
    usuarios: [
      { ...usuarioActual },
      ...alumnos.map((alumno, indice) => ({
        idUsuario: `U${indice + 2}`,
        idAlumno: alumno.idAlumno,
        nombre: `${alumno.nombre} ${alumno.apellido}`,
        correo: alumno.correo,
        rol: "alumno" as const,
        estado: alumno.estado,
      })),
    ],
  };
}
