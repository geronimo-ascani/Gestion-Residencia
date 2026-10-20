import type {
  Alumno,
  Ambiente,
  Contrato,
  DataState,
  GrupoDeLimpieza,
  GrupoLimpiezaAlumno,
  GrupoLimpiezaAmbiente,
  Habitacion,
  HabitacionAlumno,
  Multa,
  Pago,
  Usuario,
} from "../types";

const NOMBRES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elena",
  "Facundo",
  "Gabriela",
  "Hernán",
  "Inés",
  "Joaquín",
  "Karen",
  "Lucas",
  "María",
  "Nicolás",
  "Olivia",
  "Pablo",
  "Quimey",
  "Rocío",
  "Santiago",
  "Valentina",
] as const;

const APELLIDOS = [
  "Pérez",
  "Gómez",
  "Rodríguez",
  "Fernández",
  "López",
  "Martínez",
  "Sosa",
  "Romero",
  "Díaz",
  "Torres",
  "Ruiz",
  "Álvarez",
  "Benítez",
  "Acosta",
  "Medina",
  "Herrera",
  "Aguirre",
  "Castro",
  "Silva",
  "Rojas",
] as const;

/** Rellena con cero a la izquierda para los identificadores y fechas mock. */
function pad(valor: number): string {
  return String(valor).padStart(2, "0");
}

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");
}

const HABITACIONES_BASE: Array<[string, number, string]> = [
  ["101", 2, "Doble con baño privado"],
  ["102", 3, "Triple con baño compartido"],
  ["103", 4, "Cuádruple con baño privado"],
  ["104", 2, "Doble con balcón"],
  ["105", 3, "Triple con baño compartido"],
  ["201", 4, "Cuádruple con baño privado"],
  ["202", 2, "Doble con baño privado"],
  ["203", 3, "Triple con escritorio"],
  ["204", 2, "Doble con baño compartido"],
  ["205", 4, "Cuádruple con vestidor"],
  ["301", 3, "Triple con baño privado"],
  ["302", 2, "Doble con balcón"],
  ["303", 4, "Cuádruple con baño compartido"],
  ["304", 3, "Triple con escritorio"],
  ["305", 2, "Doble con baño privado"],
];

const OCUPACION_INICIAL = [2, 3, 4, 2, 3, 4, 2, 3, 1, 0, 3, 2, 0, 3, 2];

const AMBIENTES_BASE: Array<[string, string]> = [
  ["Cocina", "Limpiar mesadas, heladera, microondas y piso"],
  ["Baño planta baja", "Desinfectar inodoro, lavatorio, ducha y espejos"],
  ["Baño planta alta", "Desinfectar inodoro, lavatorio, ducha y espejos"],
  ["Pasillo planta baja", "Barrer, trapear y retirar residuos"],
  ["Pasillo planta alta", "Barrer, trapear y retirar residuos"],
  ["Comedor", "Limpiar mesas, sillas y piso"],
  ["Lavadero", "Limpiar pileta, ordenar y tender"],
  ["Patio", "Barrer hojas y ordenar el mobiliario"],
  ["Sala de estudio", "Ordenar mesas, sillas y estantes"],
  ["Escaleras", "Barrer y trapear escalones y pasamanos"],
];

export function createInitialData(): DataState {
  const alumnos: Alumno[] = Array.from({ length: 40 }, (_, indice) => {
    const nombre = NOMBRES[indice % NOMBRES.length];
    const apellido = APELLIDOS[(indice * 3 + 1) % APELLIDOS.length];
    return {
      idAlumno: `A${pad(indice + 1)}`,
      nombre,
      apellido,
      telefono: `11 ${5000 + indice * 13} ${3000 + indice * 7}`,
      correo: `${slug(nombre)}.${slug(apellido)}${indice + 1}@correo.com`,
      documento: `${30 + (indice % 5)}.${100 + indice}.${200 + indice}`,
    };
  });

  const habitaciones: Habitacion[] = HABITACIONES_BASE.map(
    ([numero, capacidad, descripcion]) => ({
      idHabitacion: `H${numero}`,
      numeroHabitacion: numero,
      capacidadMaxima: capacidad,
      descripcion,
    }),
  );

  const asignaciones: HabitacionAlumno[] = [];
  let indiceAlumno = 0;

  OCUPACION_INICIAL.forEach((cantidad, indiceHabitacion) => {
    const habitacion = habitaciones[indiceHabitacion];
    for (let cupo = 0; cupo < cantidad; cupo += 1) {
      const alumno = alumnos[indiceAlumno];
      indiceAlumno += 1;
      asignaciones.push({
        idAlumno: alumno.idAlumno,
        idHabitacion: habitacion.idHabitacion,
        fechaDesde: "2026-03-01",
        fechaHasta: null,
      });
    }
  });

  // Historial: tres alumnos cambiaron de habitación al inicio del ciclo.
  ["A01", "A02", "A03"].forEach((idAlumno, indice) => {
    asignaciones.push({
      idAlumno,
      idHabitacion: habitaciones[9 + indice].idHabitacion,
      fechaDesde: "2025-08-01",
      fechaHasta: "2026-02-28",
    });
  });

  const contratos: Contrato[] = alumnos.map((alumno, indice) => {
    let fechaHasta = "2027-03-31";

    if (indice < 34) {
      if (indice % 7 === 0)
        fechaHasta = `2026-11-${pad(5 + (indice % 5) * 3)}`;
      else if (indice % 5 === 0) fechaHasta = "2026-12-20";
    } else if (indice >= 37) {
      fechaHasta = "2026-08-31";
    }

    return {
      idContrato: `C${pad(indice + 1)}`,
      idAlumno: alumno.idAlumno,
      fechaDesde: indice >= 37 ? "2025-03-01" : "2026-03-01",
      fechaHasta,
    };
  });

  const pagos: Pago[] = alumnos.slice(0, 37).map((alumno, indice) => ({
    idPago: `P${pad(indice + 1)}`,
    idAlumno: alumno.idAlumno,
    monto: 45_000,
    fecha: `2026-10-${pad(1 + (indice % 18))}`,
    concepto: "Residencia",
  }));

  const multasBase: Array<{
    alumno: number;
    monto: number;
    emision: string;
    vence: string;
    estado: Multa["estado"];
  }> = [
    { alumno: 2, monto: 8_000, emision: "2026-09-15", vence: "2026-10-05", estado: "pendiente" },
    { alumno: 5, monto: 12_000, emision: "2026-09-20", vence: "2026-10-10", estado: "pendiente" },
    { alumno: 9, monto: 6_000, emision: "2026-10-01", vence: "2026-10-25", estado: "pendiente" },
    { alumno: 12, monto: 15_000, emision: "2026-10-05", vence: "2026-11-05", estado: "pendiente" },
    { alumno: 18, monto: 9_000, emision: "2026-08-10", vence: "2026-09-10", estado: "pagada" },
    { alumno: 21, monto: 5_000, emision: "2026-09-01", vence: "2026-09-30", estado: "pagada" },
    { alumno: 24, monto: 20_000, emision: "2026-07-15", vence: "2026-08-15", estado: "pagada" },
    { alumno: 27, monto: 7_000, emision: "2026-09-28", vence: "2026-10-28", estado: "pendiente" },
    { alumno: 30, monto: 11_000, emision: "2026-08-20", vence: "2026-09-20", estado: "pagada" },
    { alumno: 33, monto: 4_500, emision: "2026-10-10", vence: "2026-11-10", estado: "pendiente" },
    { alumno: 36, monto: 13_000, emision: "2026-06-10", vence: "2026-07-10", estado: "anulada" },
    { alumno: 38, monto: 9_500, emision: "2026-09-05", vence: "2026-10-05", estado: "pagada" },
  ];

  const multas: Multa[] = multasBase.map((definicion, indice) => ({
    idMulta: `M${pad(indice + 1)}`,
    idAlumno: alumnos[definicion.alumno].idAlumno,
    monto: definicion.monto,
    fechaEmision: definicion.emision,
    fechaVence: definicion.vence,
    estado: definicion.estado,
    fechaPago: definicion.estado === "pagada" ? "2026-10-01" : null,
  }));

  const grupos: GrupoDeLimpieza[] = ["A", "B", "C", "D", "E", "F"].map(
    (letra, indice) => ({
      idGrupoLimpieza: `G${indice + 1}`,
      nombreDelGrupo: `Grupo ${letra}`,
    }),
  );

  const grupoAlumnos: GrupoLimpiezaAlumno[] = alumnos.map((alumno, indice) => ({
    idGrupoLimpieza: `G${(indice % grupos.length) + 1}`,
    idAlumno: alumno.idAlumno,
  }));

  const ambientes: Ambiente[] = AMBIENTES_BASE.map(([ambiente, tareas], indice) => ({
    idAmbiente: `AM${pad(indice + 1)}`,
    ambiente,
    tareas,
  }));

  const grupoAmbientes: GrupoLimpiezaAmbiente[] = [];
  grupos.forEach((grupo, indice) => {
    [indice, indice + 6]
      .filter((indiceAmbiente) => indiceAmbiente < ambientes.length)
      .forEach((indiceAmbiente) => {
        grupoAmbientes.push({
          idGrupoLimpieza: grupo.idGrupoLimpieza,
          idAmbiente: ambientes[indiceAmbiente].idAmbiente,
          fechaDesde: "2026-08-01",
          fechaHasta: null,
        });
      });
  });

  const usuarios: Usuario[] = [
    {
      idUsuario: "U1",
      nombre: "Ana Pérez",
      correo: "ana@residencia.ar",
      rol: "administrador",
      estado: "activo",
    },
    {
      idUsuario: "U2",
      nombre: `${alumnos[0].nombre} ${alumnos[0].apellido}`,
      correo: alumnos[0].correo,
      rol: "alumno",
      idAlumno: alumnos[0].idAlumno,
      estado: "activo",
    },
    {
      idUsuario: "U3",
      nombre: `${alumnos[1].nombre} ${alumnos[1].apellido}`,
      correo: alumnos[1].correo,
      rol: "alumno",
      idAlumno: alumnos[1].idAlumno,
      estado: "activo",
    },
  ];

  return {
    alumnos,
    habitaciones,
    asignaciones,
    contratos,
    pagos,
    multas,
    grupos,
    grupoAlumnos,
    ambientes,
    grupoAmbientes,
    usuarios,
  };
}
