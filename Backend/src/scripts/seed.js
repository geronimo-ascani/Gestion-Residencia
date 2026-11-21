import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { PARAMETROS_DEFAULT } from "../services/administracion.service.js";

const CAPACIDADES = [2, 2, 4, 4, 5];

const AMBIENTES_COMUNES = [
  {
    nombre: "Lavadero",
    tipo: "Lavadero",
    equipamiento: [{ nombre: "Lavarropas", cantidad: 1 }],
    tareas: "",
  },
  ...[1, 2].map((num) => ({
    nombre: `Sala de estudio ${num}`,
    tipo: "Sala de estudio",
    equipamiento: [
      { nombre: "Mesas", cantidad: 3 },
      { nombre: "Sillas", cantidad: 3 },
    ],
    tareas: "Limpiar las mesas y las sillas, barrer y limpiar el piso, ordenar y retirar los residuos.",
  })),
  ...[1, 2, 3].map((num) => ({
    nombre: `Baño ${num}`,
    tipo: "Baño",
    equipamiento: [
      { nombre: "Inodoro", cantidad: 1 },
      { nombre: "Lavamanos", cantidad: 1 },
    ],
    tareas: "Limpiar y desinfectar el inodoro y el lavamanos, limpiar el piso y retirar los residuos.",
  })),
  ...[1, 2].map((num) => ({
    nombre: `Cocina ${num}`,
    tipo: "Cocina",
    equipamiento: [
      { nombre: "Hornos eléctricos", cantidad: 2 },
      { nombre: "Heladeras", cantidad: 2 },
      ...(num === 1 ? [{ nombre: "Freezer grande", cantidad: 1 }] : []),
    ],
    tareas: "Limpiar los hornos, las heladeras y las superficies, barrer y limpiar el piso y retirar los residuos. Coordinar la limpieza del freezer compartido.",
  })),
  {
    nombre: "Duchas",
    tipo: "Duchas",
    equipamiento: [
      { nombre: "Duchas", cantidad: 4 },
      { nombre: "Mingitorios", cantidad: 2 },
      { nombre: "Bacha", cantidad: 1 },
    ],
    tareas: "Limpiar y desinfectar las duchas, los mingitorios y la bacha, limpiar el piso y retirar los residuos.",
  },
  {
    nombre: "Comedor",
    tipo: "Comedor",
    equipamiento: [
      { nombre: "Mesas grandes", cantidad: 4 },
      { nombre: "Sillas", cantidad: 16 },
    ],
    tareas: "Limpiar las mesas y las sillas, ordenar el mobiliario, barrer y limpiar el piso y retirar los residuos.",
  },
];

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
];

const CARRERAS = [
  "Ingeniería en Sistemas de Información",
  "Ingeniería Industrial",
  "Licenciado en Administración Rural",
];

const VINCULOS = ["Madre", "Padre", "Familiar", "Tutor/a", "Pareja", "Amigo/a", "Otro"];

const TAREAS_LIMPIEZA = [
  {
    numero: 1,
    nombre: "Baños",
    enRotacion: true,
    actividades: ["Limpiar y desinfectar el inodoro y el lavamanos", "Limpiar el piso", "Retirar los residuos"],
  },
  {
    numero: 2,
    nombre: "Salas comunes",
    enRotacion: true,
    actividades: ["Limpiar las mesas y las sillas", "Barrer y limpiar el piso", "Ordenar y retirar los residuos"],
  },
  {
    numero: 3,
    nombre: "Duchas",
    enRotacion: true,
    actividades: ["Limpiar y desinfectar las duchas, mingitorios y bacha", "Limpiar el piso", "Retirar los residuos"],
  },
  {
    numero: 4,
    nombre: "Cocinas",
    enRotacion: true,
    actividades: [
      "Limpiar los hornos, heladeras y superficies",
      "Barrer y limpiar el piso y retirar los residuos",
      "Coordinar la limpieza del freezer compartido",
    ],
  },
];

function pad(num) {
  return String(num).padStart(2, "0");
}

function claveInicial(apellido, documento) {
  const primero = apellido.trim().split(/\s+/)[0];
  const dni = documento.replace(/\D/g, "");
  return primero + dni.slice(-3);
}

export async function seedDatabase() {
  console.log("🌱 Iniciando migración y poblado de la base de datos...");

  // 1. Limpieza de datos transaccionales para una carga limpia
  console.log("🧹 Limpiando tablas de datos previas...");
  await prisma.pago.deleteMany();
  await prisma.detalleFactura.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.cambioMulta.deleteMany();
  await prisma.multa.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.habitacionAlumno.deleteMany();
  await prisma.grupoLimpiezaAlumno.deleteMany();
  await prisma.grupoLimpiezaAmbiente.deleteMany();
  await prisma.grupoDeLimpieza.deleteMany();
  await prisma.equipamientoAmbiente.deleteMany();
  await prisma.ambiente.deleteMany();
  await prisma.contactoEmergencia.deleteMany();
  await prisma.seguimientoReclamo.deleteMany();
  await prisma.reclamo.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.cambioAdministrativo.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.tokenRestablecimiento.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.habitacion.deleteMany();

  // 2. Roles
  console.log("👥 Configurando Roles...");
  const rolAdmin = await prisma.rol.upsert({
    where: { rol: "ADMINISTRADOR" },
    update: {},
    create: { rol: "ADMINISTRADOR" },
  });
  const rolAlumno = await prisma.rol.upsert({
    where: { rol: "ALUMNO" },
    update: {},
    create: { rol: "ALUMNO" },
  });

  // 3. Parámetros del sistema
  console.log("⚙️  Configurando Parámetros del Sistema...");
  for (const [clave, valor] of Object.entries(PARAMETROS_DEFAULT)) {
    await prisma.parametroSistema.upsert({
      where: { clave },
      update: { valor },
      create: { clave, valor },
    });
  }

  // 4. Catálogos Dinámicos
  console.log("📚 Configurando Catálogos (carreras y vínculos)...");
  for (const nombre of CARRERAS) {
    await prisma.opcionCatalogo.upsert({
      where: { catalogo_nombre: { catalogo: "carreras", nombre } },
      update: { activa: true },
      create: { catalogo: "carreras", nombre, activa: true },
    });
  }
  for (const nombre of VINCULOS) {
    await prisma.opcionCatalogo.upsert({
      where: { catalogo_nombre: { catalogo: "vinculos", nombre } },
      update: { activa: true },
      create: { catalogo: "vinculos", nombre, activa: true },
    });
  }

  // 5. Tareas de Limpieza
  console.log("🧹 Configurando Tareas de Limpieza...");
  for (const t of TAREAS_LIMPIEZA) {
    await prisma.tareaLimpieza.upsert({
      where: { numero: t.numero },
      update: { nombre: t.nombre, actividades: t.actividades, enRotacion: t.enRotacion },
      create: t,
    });
  }

  // 6. Habitaciones (H1 a H5)
  console.log("🛏️  Creando Habitaciones H1 - H5...");
  const habitacionMap = new Map();
  for (let i = 0; i < CAPACIDADES.length; i++) {
    const num = i + 1;
    const capacidad = CAPACIDADES[i];
    const hab = await prisma.habitacion.create({
      data: {
        numeroHabitacion: String(num),
        pisoHabitacion: 0,
        capacidadMaxima: capacidad,
        descripcion: `Habitación para ${capacidad} personas en planta baja.`,
      },
    });
    habitacionMap.set(num, hab);
  }

  // 7. Ambientes y Equipamiento
  console.log("🏡 Creando Ambientes Comunes y Equipamiento...");
  for (const ambData of AMBIENTES_COMUNES) {
    const amb = await prisma.ambiente.create({
      data: {
        nombre: ambData.nombre,
        tipo: ambData.tipo,
        tareas: ambData.tareas,
      },
    });
    for (const eq of ambData.equipamiento) {
      await prisma.equipamientoAmbiente.create({
        data: {
          idAmbiente: amb.idAmbiente,
          nombre: eq.nombre,
          cantidad: eq.cantidad,
        },
      });
    }
  }

  // 8. Usuario Administrador Inicial
  console.log("👑 Creando Usuario Administrador...");
  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash("Pérez123", salt);
  const adminUser = await prisma.usuario.create({
    data: {
      correo: "ana@residencia.ar",
      contrasenaHash: hashAdmin,
      nombre: "Ana",
      apellido: "Pérez",
      documento: "30000123",
      telefono: "2392 555000",
      idRol: rolAdmin.idRol,
      estado: "activo",
      gestionaAdministradores: true,
      fechaAlta: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

  // 9. Alumnos y Contactos de Emergencia
  console.log("🎓 Creando 14 Alumnos Residentes y Cuentas de Acceso...");
  const alumnoList = [];
  for (let i = 0; i < RESIDENTES.length; i++) {
    const [nombre, apellido, habNum, idxCarrera, localidad, codigoPostal] = RESIDENTES[i];
    const indice = i;
    const padIdx = pad(indice + 1);
    const documento = String(46_000_001 + indice);
    const correo = `alumno${padIdx}@example.com`;
    const telefono = `2392 5551${padIdx}`;
    const fechaNacimiento = new Date(`${2003 + (indice % 4)}-${pad(1 + (indice % 12))}-${pad(5 + indice)}T00:00:00.000Z`);

    const alumno = await prisma.alumno.create({
      data: {
        nombre,
        apellido,
        documento,
        telefono,
        correoContacto: correo,
        estado: "activo",
        fechaNacimiento,
        nacionalidad: "Argentina",
        domicilio: `Calle de ejemplo ${100 + indice * 25}`,
        localidad,
        provincia: "Buenos Aires",
        codigoPostal,
        institucion: "UTN · Facultad Regional Trenque Lauquen",
        carrera: CARRERAS[idxCarrera],
        anioCursado: `${1 + (indice % 4)}° año`,
        cantidadMateriasCursadas: 6 + (indice % 4) * 6,
        legajo: `2026-${padIdx}`,
        observaciones: "Ficha oficial de alumno residente.",
        contactosEmergencia: {
          create: [
            {
              nombre: `Laura ${apellido}`,
              vinculo: "Madre",
              telefono: `2392 5552${padIdx}`,
              orden: 1,
            },
            {
              nombre: `Sergio ${apellido}`,
              vinculo: "Padre",
              telefono: `2392 5553${padIdx}`,
              orden: 2,
            },
          ],
        },
      },
    });

    // Crear cuenta de usuario vinculada
    const passPlano = claveInicial(apellido, documento);
    const hashAlumno = await bcrypt.hash(passPlano, salt);
    await prisma.usuario.create({
      data: {
        correo,
        contrasenaHash: hashAlumno,
        nombre,
        apellido,
        documento,
        telefono,
        idRol: rolAlumno.idRol,
        idAlumno: alumno.idAlumno,
        estado: "activo",
      },
    });

    alumnoList.push({ alumno, habNum, indice });
  }

  // 10. Asignaciones de Habitación (Activas e Históricas)
  console.log("🛏️  Asignando Habitaciones a los Residentes...");
  for (const { alumno, habNum } of alumnoList) {
    const hab = habitacionMap.get(habNum);
    await prisma.habitacionAlumno.create({
      data: {
        idAlumno: alumno.idAlumno,
        idHabitacion: hab.idHabitacion,
        fechaDesde: new Date("2026-03-01T00:00:00.000Z"),
        fechaHasta: null,
      },
    });
  }

  // Asignaciones históricas
  const a01 = alumnoList[0].alumno;
  const a02 = alumnoList[1].alumno;
  const h3 = habitacionMap.get(3);
  const h1 = habitacionMap.get(1);

  await prisma.habitacionAlumno.create({
    data: {
      idAlumno: a01.idAlumno,
      idHabitacion: h3.idHabitacion,
      fechaDesde: new Date("2025-03-01T00:00:00.000Z"),
      fechaHasta: new Date("2026-03-01T00:00:00.000Z"),
    },
  });

  await prisma.habitacionAlumno.create({
    data: {
      idAlumno: a02.idAlumno,
      idHabitacion: h1.idHabitacion,
      fechaDesde: new Date("2025-03-01T00:00:00.000Z"),
      fechaHasta: new Date("2025-10-01T00:00:00.000Z"),
    },
  });

  // 11. Contratos
  console.log("📄 Creando Contratos de Residencia...");
  const contratos = [];
  for (let i = 0; i < alumnoList.length; i++) {
    const { alumno } = alumnoList[i];
    const fechaHasta = i < 3 ? "2026-11-10" : "2027-02-28";
    const contrato = await prisma.contrato.create({
      data: {
        idAlumno: alumno.idAlumno,
        fechaDesde: new Date("2026-03-01T00:00:00.000Z"),
        fechaHasta: new Date(`${fechaHasta}T00:00:00.000Z`),
        fechaFirma: new Date("2026-02-20T00:00:00.000Z"),
        montoMensual: 45000.0,
        depositoGarantia: 0.0,
        diaVencimientoPago: 10,
        estado: "VIGENTE",
      },
    });
    contratos.push(contrato);
  }

  // Contratos históricos (renovación y cancelación)
  await prisma.contrato.create({
    data: {
      idAlumno: a01.idAlumno,
      fechaDesde: new Date("2025-03-01T00:00:00.000Z"),
      fechaHasta: new Date("2026-02-28T00:00:00.000Z"),
      montoMensual: 40000.0,
      estado: "FINALIZADO",
    },
  });

  await prisma.contrato.create({
    data: {
      idAlumno: a02.idAlumno,
      fechaDesde: new Date("2025-03-01T00:00:00.000Z"),
      fechaHasta: new Date("2026-02-28T00:00:00.000Z"),
      fechaCancelacion: new Date("2025-10-01T00:00:00.000Z"),
      motivoCancelacion: "Interrupción de la estadía por motivos personales (ejemplo).",
      montoMensual: 40000.0,
      estado: "CANCELADO",
    },
  });

  // 12. Grupos de Limpieza
  console.log("🧹 Creando Grupos de Limpieza y asignando integrantes...");
  for (let num = 1; num <= 4; num++) {
    const grupo = await prisma.grupoDeLimpieza.create({
      data: {
        nombreDelGrupo: `Grupo ${num}`,
        posicionInicial: num,
      },
    });

    // Asignar integrantes según residentes
    for (let i = 0; i < alumnoList.length; i++) {
      const { alumno, habNum } = alumnoList[i];
      const grupoAsignado = Math.min(habNum, 4);
      if (grupoAsignado === num) {
        await prisma.grupoLimpiezaAlumno.create({
          data: {
            idGrupoLimpieza: grupo.idGrupoLimpieza,
            idAlumno: alumno.idAlumno,
          },
        });
      }
    }
  }

  // 13. Multas iniciales
  console.log("⚠️  Registrando Multas...");
  const a03 = alumnoList[2].alumno;
  const a08 = alumnoList[7].alumno;
  const a12 = alumnoList[11].alumno;

  const m01 = await prisma.multa.create({
    data: {
      idAlumno: a03.idAlumno,
      tipo: "leve",
      motivo: "Sanción de residencia",
      monto: 5000.0,
      montoSancion: 5000.0,
      fechaEmision: new Date("2026-10-01T00:00:00.000Z"),
      fechaVence: new Date("2026-10-15T00:00:00.000Z"),
      estadoMulta: "PENDIENTE",
    },
  });

  await prisma.multa.create({
    data: {
      idAlumno: a08.idAlumno,
      tipo: "leve",
      motivo: "Incumplimiento de horario de silencio",
      monto: 4000.0,
      montoSancion: 4000.0,
      fechaEmision: new Date("2026-10-15T00:00:00.000Z"),
      fechaVence: new Date("2026-10-30T00:00:00.000Z"),
      estadoMulta: "PENDIENTE",
    },
  });

  await prisma.multa.create({
    data: {
      idAlumno: a12.idAlumno,
      tipo: "leve",
      motivo: "Falta en turno de limpieza",
      monto: 3000.0,
      montoSancion: 3000.0,
      fechaEmision: new Date("2026-09-10T00:00:00.000Z"),
      fechaVence: new Date("2026-09-25T00:00:00.000Z"),
      estadoMulta: "PAGADA",
      fechaPago: new Date("2026-09-20T00:00:00.000Z"),
      montoPagado: 3000.0,
    },
  });

  // 14. Facturas y Pagos
  console.log("🧾 Generando Facturas y Pagos de Septiembre y Octubre 2026...");
  for (let i = 0; i < alumnoList.length; i++) {
    const { alumno } = alumnoList[i];
    const contrato = contratos[i];

    // Factura 2026-09
    const f09 = await prisma.factura.create({
      data: {
        idContrato: contrato.idContrato,
        idAlumno: alumno.idAlumno,
        periodo: "2026-09",
        fechaEmision: new Date("2026-09-01T00:00:00.000Z"),
        fechaVence: new Date("2026-09-10T00:00:00.000Z"),
        titular: `${alumno.apellido}, ${alumno.nombre}`,
        documento: alumno.documento,
        detalles: {
          create: [
            {
              concepto: "Alojamiento mensual · 2026-09",
              monto: 45000.0,
              orden: 1,
            },
          ],
        },
      },
    });

    // Pago 2026-09
    await prisma.pago.create({
      data: {
        idAlumno: alumno.idAlumno,
        idFactura: f09.idFactura,
        monto: 45000.0,
        fecha: new Date("2026-09-05T00:00:00.000Z"),
        concepto: "Residencia · Septiembre 2026",
        medio: "transferencia",
      },
    });

    // Factura 2026-10
    const detalles10 = [
      {
        concepto: "Alojamiento mensual · 2026-10",
        monto: 45000.0,
        orden: 1,
      },
    ];

    if (alumno.idAlumno === a03.idAlumno) {
      detalles10.push({
        concepto: "Multa M01 · Sanción de residencia",
        monto: 5000.0,
        idMulta: m01.idMulta,
        orden: 2,
      });
    }

    const f10 = await prisma.factura.create({
      data: {
        idContrato: contrato.idContrato,
        idAlumno: alumno.idAlumno,
        periodo: "2026-10",
        fechaEmision: new Date("2026-10-01T00:00:00.000Z"),
        fechaVence: new Date("2026-10-10T00:00:00.000Z"),
        titular: `${alumno.apellido}, ${alumno.nombre}`,
        documento: alumno.documento,
        detalles: {
          create: detalles10,
        },
      },
    });

    // Pago 2026-10
    const diaPago = pad(1 + (i % 10));
    await prisma.pago.create({
      data: {
        idAlumno: alumno.idAlumno,
        idFactura: f10.idFactura,
        monto: 45000.0,
        fecha: new Date(`2026-10-${diaPago}T00:00:00.000Z`),
        concepto: "Residencia · Octubre 2026",
        medio: "transferencia",
      },
    });
  }

  console.log("✅ Poblado de la base de datos completado exitosamente!");
}

// Ejecutar directamente si se llama via CLI
seedDatabase()
  .catch((err) => {
    console.error("❌ Error durante la ejecución del seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
