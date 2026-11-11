import { TAREAS_LIMPIEZA } from "../domain";
import type { Alumno, Ambiente, Contrato, DataState, Habitacion, HabitacionAlumno } from "../types";
import { usuarioActual } from "../session";

const CAPACIDADES = [2, 2, 4, 4, 5] as const;

const AMBIENTES_COMUNES: Ambiente[] = [
  {
    idAmbiente: "AM_LAVADERO",
    ambiente: "Lavadero",
    tipo: "Lavadero",
    equipamiento: [{ nombre: "Lavarropas", cantidad: 1 }],
    tareas: "",
  },
  ...[1, 2].map((numero): Ambiente => ({
    idAmbiente: `AM_ESTUDIO_${numero}`,
    ambiente: `Sala de estudio ${numero}`,
    tipo: "Sala de estudio",
    equipamiento: [{ nombre: "Mesas", cantidad: 3 }, { nombre: "Sillas", cantidad: 3 }],
    tareas: "Limpiar las mesas y las sillas, barrer y limpiar el piso, ordenar y retirar los residuos.",
  })),
  ...[1, 2, 3].map((numero): Ambiente => ({
    idAmbiente: `AM_BANO_${numero}`,
    ambiente: `Baño ${numero}`,
    tipo: "Baño",
    equipamiento: [{ nombre: "Inodoro", cantidad: 1 }, { nombre: "Lavamanos", cantidad: 1 }],
    tareas: "Limpiar y desinfectar el inodoro y el lavamanos, limpiar el piso y retirar los residuos.",
  })),
  ...[1, 2].map((numero): Ambiente => ({
    idAmbiente: `AM_COCINA_${numero}`,
    ambiente: `Cocina ${numero}`,
    tipo: "Cocina",
    equipamiento: [
      { nombre: "Hornos eléctricos", cantidad: 2 },
      { nombre: "Heladeras", cantidad: 2 },
      ...(numero === 1 ? [{ nombre: "Freezer grande", cantidad: 1 }] : []),
    ],
    tareas: "Limpiar los hornos, las heladeras y las superficies, barrer y limpiar el piso y retirar los residuos. Coordinar la limpieza del freezer compartido.",
  })),
  {
    idAmbiente: "AM_DUCHAS",
    ambiente: "Duchas",
    tipo: "Duchas",
    equipamiento: [
      { nombre: "Duchas", cantidad: 4 },
      { nombre: "Mingitorios", cantidad: 2 },
      { nombre: "Bacha", cantidad: 1 },
    ],
    tareas: "Limpiar y desinfectar las duchas, los mingitorios y la bacha, limpiar el piso y retirar los residuos.",
  },
  {
    idAmbiente: "AM_COMEDOR",
    ambiente: "Comedor",
    tipo: "Comedor",
    equipamiento: [
      { nombre: "Mesas grandes", cantidad: 4 },
      { nombre: "Sillas", cantidad: 16 },
    ],
    tareas: "Limpiar las mesas y las sillas, ordenar el mobiliario, barrer y limpiar el piso y retirar los residuos.",
  },
];

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
    montoMensual: 45000,
    diaVencimientoPago: 10,
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
    facturas: alumnos.flatMap((alumno, indice) => ["2026-09", "2026-10"].map((periodo) => ({
      idFactura: `F-${alumno.idAlumno}-${periodo}`, idContrato: contratos[indice].idContrato,
      idAlumno: alumno.idAlumno, titular: `${alumno.apellido}, ${alumno.nombre}`, documento: alumno.documento,
      periodo, fechaEmision: `${periodo}-01`, fechaVence: `${periodo}-10`,
      detalles: [
        { concepto: `Alojamiento mensual · ${periodo}`, monto: 45000 },
        ...(alumno.idAlumno === "A03" && periodo === "2026-10" ? [{ concepto: "Multa M01 · Sanción de residencia", monto: 5000, idMulta: "M01" }] : []),
      ],
    }))),
    habitaciones,
    alumnos,
    asignaciones,
    contratos,
    pagos: alumnos.flatMap((alumno, indice) => [
      {
        idPago: `P${pad(indice * 2 + 1)}`,
        idFactura: `F-${alumno.idAlumno}-2026-09`,
        idAlumno: alumno.idAlumno,
        monto: 45_000,
        fecha: "2026-09-05",
        concepto: "Residencia · Septiembre 2026",
      },
      {
        idPago: `P${pad(indice * 2 + 2)}`,
        idFactura: `F-${alumno.idAlumno}-2026-10`,
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
    tareasLimpieza: TAREAS_LIMPIEZA.map((tarea) => ({ ...tarea, tareas: [...tarea.tareas] })),
    grupos: [1, 2, 3, 4].map((numero) => ({
      idGrupoLimpieza: `G${numero}`,
      nombreDelGrupo: `Grupo ${numero}`,
      tareaInicial: numero,
    })),
    grupoAlumnos: RESIDENTES.map(([, , habitacion], indice) => ({
      idGrupoLimpieza: `G${Math.min(habitacion, 4)}`,
      idAlumno: alumnos[indice].idAlumno,
    })),
    ambientes: [...habitaciones.map((habitacion) => ({
      idAmbiente: `AM${habitacion.numeroHabitacion}`,
      ambiente: `Habitación ${habitacion.numeroHabitacion}`,
      tareas: "Barrer, limpiar el piso, ordenar los espacios compartidos y retirar los residuos.",
    })), ...AMBIENTES_COMUNES],
    grupoAmbientes: [],
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
