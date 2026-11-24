import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../utils/customErrors.js";

/**
 * Parámetros de configuración iniciales del sistema.
 */
export const PARAMETROS_DEFAULT = {
  multaLeve: 10000,
  multaModerada: 25000,
  multaGrave: 40000,
  recargoMulta: 20,
  cuotaMensual: 180000,
  deposito: 0,
  diaVencimiento: 10,
  duracionContrato: 365,
};

/**
 * Capa de Servicio: Administración del Sistema, Parámetros, Auditoría y Notificaciones
 */
class AdministracionService {
  /**
   * ==========================================
   * PARÁMETROS DEL SISTEMA
   * ==========================================
   */

  #parametrosAsegurados = false;
  #catalogosAsegurados = false;

  /**
   * Inicializa los parámetros del sistema si aún no existen en la base de datos.
   */
  async #asegurarParametros() {
    if (this.#parametrosAsegurados) return;
    const total = await prisma.parametroSistema.count();
    if (total === 0) {
      for (const [clave, valor] of Object.entries(PARAMETROS_DEFAULT)) {
        await prisma.parametroSistema.upsert({
          where: { clave },
          update: {},
          create: { clave, valor },
        });
      }
    }
    this.#parametrosAsegurados = true;
  }

  /**
   * Obtiene todos los parámetros del sistema en un diccionario clave-valor.
   */
  async getParametros() {
    await this.#asegurarParametros();
    const filas = await prisma.parametroSistema.findMany();

    const params = { ...PARAMETROS_DEFAULT };
    for (const fila of filas) {
      params[fila.clave] = Number(fila.valor);
    }

    return params;
  }

  /**
   * Actualiza los parámetros del sistema y registra el cambio en la bitácora administrativa.
   */
  async updateParametros(nuevosValores, idActor = null) {
    await this.#asegurarParametros();
    const anteriores = await this.getParametros();

    const cambiosRegistrados = [];

    const resultado = await prisma.$transaction(async (tx) => {
      for (const [clave, nuevoValor] of Object.entries(nuevosValores)) {
        if (nuevoValor !== undefined && nuevoValor !== null) {
          const valNum = Number(nuevoValor);
          await tx.parametroSistema.upsert({
            where: { clave },
            update: { valor: valNum },
            create: { clave, valor: valNum },
          });

          if (anteriores[clave] !== valNum) {
            cambiosRegistrados.push(`${clave}: ${anteriores[clave] ?? "—"} → ${valNum}`);
          }
        }
      }

      // Si hubo actor y diferencias, registrar en CambioAdministrativo
      if (idActor && cambiosRegistrados.length > 0) {
        await tx.cambioAdministrativo.create({
          data: {
            idActor: Number(idActor),
            seccion: "Parámetros",
            accion: "Modificación",
            detalle: cambiosRegistrados.join(" · "),
          },
        });
      }

      const filasActualizadas = await tx.parametroSistema.findMany();
      const paramsActualizados = {};
      for (const f of filasActualizadas) {
        paramsActualizados[f.clave] = Number(f.valor);
      }
      return paramsActualizados;
    });

    return resultado;
  }

  /**
   * ==========================================
   * AUDITORÍA Y CAMBIOS ADMINISTRATIVOS
   * ==========================================
   */

  /**
   * Registra manualmente un evento en la bitácora de auditoría administrativa.
   */
  async registrarCambio({ idActor, seccion, accion, referencia, detalle }) {
    if (!idActor) {
      throw new BadRequestError("El ID del actor que realiza el cambio es obligatorio.");
    }

    return await prisma.cambioAdministrativo.create({
      data: {
        idActor: Number(idActor),
        seccion: seccion.trim(),
        accion: accion.trim(),
        referencia: referencia?.trim() || null,
        detalle: detalle.trim(),
      },
      include: {
        actor: {
          select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });
  }

  /**
   * Lista el historial administrativo con paginación, filtros y búsqueda.
   */
  async getAllCambios({ page = 1, limit = 50, seccion, accion, idActor, search } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (seccion) where.seccion = { equals: seccion, mode: "insensitive" };
    if (accion) where.accion = { equals: accion, mode: "insensitive" };
    if (idActor) where.idActor = Number(idActor);

    if (search) {
      where.OR = [
        { detalle: { contains: search, mode: "insensitive" } },
        { referencia: { contains: search, mode: "insensitive" } },
        { seccion: { contains: search, mode: "insensitive" } },
        { accion: { contains: search, mode: "insensitive" } },
        { actor: { nombre: { contains: search, mode: "insensitive" } } },
        { actor: { apellido: { contains: search, mode: "insensitive" } } },
        { actor: { correo: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, cambios] = await Promise.all([
      prisma.cambioAdministrativo.count({ where }),
      prisma.cambioAdministrativo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: "desc" },
        include: {
          actor: {
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              correo: true,
              rol: { select: { rol: true } },
            },
          },
        },
      }),
    ]);

    return {
      cambios: cambios.map((c) => ({
        id: String(c.idCambio),
        idCambio: c.idCambio,
        idActor: c.idActor,
        actor: c.actor ? `${c.actor.nombre || ""} ${c.actor.apellido || ""}`.trim() || c.actor.correo : "Sistema",
        rolActor: c.actor?.rol?.rol || "administrador",
        fecha: c.fecha.toISOString(),
        seccion: c.seccion,
        accion: c.accion,
        referencia: c.referencia,
        detalle: c.detalle,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * ==========================================
   * NOTIFICACIONES INTERNAS
   * ==========================================
   */

  /**
   * Crea una notificación para un usuario específico.
   */
  async crearNotificacion({ idUsuario, claveEvento, tipo = "info", titulo, detalle, destino = "" }) {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: Number(idUsuario) },
    });

    if (!usuario) {
      throw new NotFoundError(`No se encontró el usuario con ID: ${idUsuario}`);
    }

    return await prisma.notificacion.create({
      data: {
        idUsuario: Number(idUsuario),
        claveEvento: claveEvento.trim(),
        tipo,
        titulo: titulo.trim(),
        detalle: detalle.trim(),
        destino: destino.trim(),
      },
    });
  }

  /**
   * Envía una notificación directa al usuario Alumno dado su idAlumno.
   */
  async notificarAlumno(idAlumno, { claveEvento, tipo = "info", titulo, detalle, destino = "" }) {
    if (!idAlumno) return null;
    const usuario = await prisma.usuario.findFirst({
      where: { idAlumno: Number(idAlumno) },
      select: { idUsuario: true },
    });
    if (!usuario) return null;
    return await this.crearNotificacion({
      idUsuario: usuario.idUsuario,
      claveEvento,
      tipo,
      titulo,
      detalle,
      destino,
    }).catch((err) => {
      console.warn(`[Notificacion] No se pudo notificar al alumno ${idAlumno}:`, err.message);
      return null;
    });
  }

  /**
   * Envía una notificación a todos los administradores activos del sistema.
   */
  async notificarAdministradores({ claveEvento, tipo = "info", titulo, detalle, destino = "" }) {
    const admins = await prisma.usuario.findMany({
      where: {
        rol: { rol: { in: ["ADMINISTRADOR", "administrador"] } },
        estado: "activo",
      },
      select: { idUsuario: true },
    });
    if (!admins.length) return [];
    return await Promise.all(
      admins.map((admin) =>
        this.crearNotificacion({
          idUsuario: admin.idUsuario,
          claveEvento,
          tipo,
          titulo,
          detalle,
          destino,
        }).catch(() => null)
      )
    );
  }

  /**
   * Obtiene las notificaciones del usuario con conteo de no leídas.
   */
  async getNotificacionesUsuario(idUsuario, { soloNoLeidas = false } = {}) {
    const uid = Number(idUsuario);
    const where = { idUsuario: uid };

    if (soloNoLeidas) {
      where.leidaEn = null;
    }

    const [totalNoLeidas, notificaciones] = await Promise.all([
      prisma.notificacion.count({
        where: { idUsuario: uid, leidaEn: null },
      }),
      prisma.notificacion.findMany({
        where,
        orderBy: { creadaEn: "desc" },
        take: 50,
      }),
    ]);

    return {
      totalNoLeidas,
      notificaciones: notificaciones.map((n) => ({
        idNotificacion: n.idNotificacion,
        claveEvento: n.claveEvento,
        tipo: n.tipo,
        titulo: n.titulo,
        detalle: n.detalle,
        destino: n.destino,
        creadaEn: n.creadaEn.toISOString(),
        leidaEn: n.leidaEn ? n.leidaEn.toISOString() : null,
        leida: Boolean(n.leidaEn),
      })),
    };
  }

  /**
   * Marca una notificación como leída.
   */
  async marcarLeida(idNotificacion, idUsuario) {
    const notif = await prisma.notificacion.findUnique({
      where: { idNotificacion: Number(idNotificacion) },
    });

    if (!notif || notif.idUsuario !== Number(idUsuario)) {
      throw new NotFoundError("Notificación no encontrada o no autorizada.");
    }

    return await prisma.notificacion.update({
      where: { idNotificacion: Number(idNotificacion) },
      data: { leidaEn: new Date() },
    });
  }

  /**
   * Marca todas las notificaciones pendientes de un usuario como leídas.
   */
  async marcarTodasLeidas(idUsuario) {
    return await prisma.notificacion.updateMany({
      where: {
        idUsuario: Number(idUsuario),
        leidaEn: null,
      },
      data: { leidaEn: new Date() },
    });
  }

  /**
   * ==========================================
   * GESTIÓN DE ADMINISTRADORES Y CUENTAS
   * ==========================================
   */

  async getAdministradores({ page = 1, limit = 20, search, estado } = {}) {
    const rolAdmin = await prisma.rol.findFirst({
      where: { rol: { equals: "ADMINISTRADOR", mode: "insensitive" } },
    });

    if (!rolAdmin) {
      return { administradores: [], resumen: {}, pagination: { total: 0, page, limit, totalPages: 1 } };
    }

    const where = { idRol: rolAdmin.idRol };

    if (estado) {
      where.estado = estado.toLowerCase();
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { correo: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, admins, todos] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
        select: {
          idUsuario: true,
          correo: true,
          nombre: true,
          apellido: true,
          telefono: true,
          estado: true,
          gestionaAdministradores: true,
          fechaAlta: true,
        },
      }),
      prisma.usuario.findMany({
        where: { idRol: rolAdmin.idRol },
        select: { estado: true },
      }),
    ]);

    const resumen = {
      total: todos.length,
      activos: todos.filter((u) => u.estado === "activo").length,
      pendientes: todos.filter((u) => u.estado === "pendiente").length,
      suspendidos: todos.filter((u) => ["suspendido", "inactivo"].includes(u.estado)).length,
    };

    return {
      administradores: admins,
      resumen,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAdministradorById(id) {
    const admin = await prisma.usuario.findUnique({
      where: { idUsuario: Number(id) },
      select: {
        idUsuario: true,
        correo: true,
        nombre: true,
        apellido: true,
        telefono: true,
        estado: true,
        gestionaAdministradores: true,
        fechaAlta: true,
        rol: { select: { rol: true } },
      },
    });

    if (!admin) {
      throw new NotFoundError(`No se encontró el administrador con ID: ${id}`);
    }

    return admin;
  }

  async crearAdministrador({ nombre, apellido, documento, telefono, correo, contrasena, gestionaAdministradores = false }) {
    const correoLimpio = correo.toLowerCase().trim();

    const existe = await prisma.usuario.findUnique({
      where: { correo: correoLimpio },
    });

    if (existe) {
      throw new ConflictError("Ya existe una cuenta con ese correo electrónico.");
    }

    const rolAdmin = await prisma.rol.findFirst({
      where: { rol: { equals: "ADMINISTRADOR", mode: "insensitive" } },
    });

    if (!rolAdmin) {
      throw new NotFoundError("El rol de ADMINISTRADOR no está configurado en el sistema.");
    }

    // Si no se envía contraseña explícita, se calcula la clave inicial: [PrimerApellido][Últimos 3 dígitos del DNI]
    let claveFinal = contrasena?.trim();
    if (!claveFinal && apellido && documento) {
      const primero = apellido.trim().split(/\s+/)[0];
      const dni = String(documento).replace(/\D/g, "");
      if (primero && dni.length >= 3) {
        claveFinal = primero + dni.slice(-3);
      }
    }
    if (!claveFinal) {
      claveFinal = "Admin123!";
    }

    const contrasenaHash = await bcrypt.hash(claveFinal, 10);

    return await prisma.usuario.create({
      data: {
        nombre: nombre?.trim() || null,
        apellido: apellido?.trim() || null,
        documento: documento ? String(documento).trim() : null,
        telefono: telefono ? String(telefono).trim() : null,
        correo: correoLimpio,
        contrasenaHash,
        idRol: rolAdmin.idRol,
        estado: "activo",
        gestionaAdministradores: Boolean(gestionaAdministradores),
      },
      select: {
        idUsuario: true,
        correo: true,
        nombre: true,
        apellido: true,
        documento: true,
        telefono: true,
        estado: true,
        gestionaAdministradores: true,
        fechaAlta: true,
      },
    });
  }

  async updateAdministrador(id, { nombre, apellido, telefono, gestionaAdministradores, estado }) {
    const idUsuario = Number(id);

    const admin = await prisma.usuario.findUnique({
      where: { idUsuario },
    });

    if (!admin) {
      throw new NotFoundError(`No se encontró el administrador con ID: ${id}`);
    }

    return await prisma.usuario.update({
      where: { idUsuario },
      data: {
        ...(nombre !== undefined ? { nombre: nombre?.trim() || null } : {}),
        ...(apellido !== undefined ? { apellido: apellido?.trim() || null } : {}),
        ...(telefono !== undefined ? { telefono: telefono?.trim() || null } : {}),
        ...(gestionaAdministradores !== undefined ? { gestionaAdministradores: Boolean(gestionaAdministradores) } : {}),
        ...(estado !== undefined ? { estado: estado.toLowerCase() } : {}),
      },
      select: {
        idUsuario: true,
        correo: true,
        nombre: true,
        apellido: true,
        telefono: true,
        estado: true,
        gestionaAdministradores: true,
        fechaAlta: true,
      },
    });
  }

  async cambiarEstadoCuenta(idUsuario, { suspender }, idActor) {
    const targetId = Number(idUsuario);

    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: targetId },
      include: {
        rol: true,
        alumno: {
          include: {
            contratos: {
              where: { estado: "VIGENTE" },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundError("La cuenta especificada no existe.");
    }

    if (idActor && targetId === Number(idActor)) {
      throw new ConflictError("No podés suspender tu propia cuenta.");
    }

    const esAdmin = usuario.rol.rol.toUpperCase() === "ADMINISTRADOR";
    const esAlumno = usuario.rol.rol.toUpperCase() === "ALUMNO";

    // Si el usuario es administrador, verificar que el actor tenga permiso de gestionar administradores
    if (esAdmin && idActor) {
      const actor = await prisma.usuario.findUnique({
        where: { idUsuario: Number(idActor) },
      });
      if (!actor || !actor.gestionaAdministradores) {
        throw new ForbiddenError("No tenés permiso para gestionar cuentas de administradores.");
      }
    }

    // Si es alumno y se va a reactivar (!suspender), verificar contrato vigente
    if (esAlumno && !suspender) {
      const tieneContratoVigente = usuario.alumno?.contratos && usuario.alumno.contratos.length > 0;
      if (!tieneContratoVigente) {
        throw new BadRequestError("No se puede restablecer el acceso a un alumno sin contrato vigente.");
      }
    }

    const nuevoEstado = suspender ? "suspendido" : "activo";

    return await prisma.$transaction(async (tx) => {
      // Revocar sesiones si se suspende
      if (suspender) {
        await tx.sesion.updateMany({
          where: { idUsuario: targetId, revocadaEn: null },
          data: { revocadaEn: new Date() },
        });
      }

      const actualizado = await tx.usuario.update({
        where: { idUsuario: targetId },
        data: { estado: nuevoEstado },
        select: {
          idUsuario: true,
          correo: true,
          nombre: true,
          apellido: true,
          estado: true,
          gestionaAdministradores: true,
        },
      });

      if (idActor) {
        await tx.cambioAdministrativo.create({
          data: {
            idActor: Number(idActor),
            seccion: "Cuentas de acceso",
            accion: suspender ? "Suspensión" : "Reactivación",
            referencia: `Usuario ${usuario.correo}`,
            detalle: `Estado de cuenta cambiado a ${nuevoEstado}`,
          },
        });
      }

      return actualizado;
    });
  }

  /**
   * ==========================================
   * CATÁLOGOS DINÁMICOS (CARRERAS Y VÍNCULOS)
   * ==========================================
   */

  async asegurarCatalogos() {
    if (this.#catalogosAsegurados) return;
    const total = await prisma.opcionCatalogo.count();
    if (total === 0) {
      const carreras = [
        "Ingeniería en Sistemas de Información",
        "Ingeniería Industrial",
        "Licenciado en Administración Rural",
      ];
      const vinculos = ["Madre", "Padre", "Familiar", "Tutor/a", "Pareja", "Amigo/a", "Otro"];

      for (const nombre of carreras) {
        await prisma.opcionCatalogo.upsert({
          where: { catalogo_nombre: { catalogo: "carreras", nombre } },
          update: {},
          create: { catalogo: "carreras", nombre, activa: true },
        });
      }

      for (const nombre of vinculos) {
        await prisma.opcionCatalogo.upsert({
          where: { catalogo_nombre: { catalogo: "vinculos", nombre } },
          update: {},
          create: { catalogo: "vinculos", nombre, activa: true },
        });
      }
    }
    this.#catalogosAsegurados = true;
  }

  async getCatalogo(tipo) {
    await this.asegurarCatalogos();
    const tipoNorm = tipo.toLowerCase().trim();
    if (!["carreras", "vinculos"].includes(tipoNorm)) {
      throw new BadRequestError("El catálogo debe ser 'carreras' o 'vinculos'.");
    }

    const opciones = await prisma.opcionCatalogo.findMany({
      where: { catalogo: tipoNorm },
      orderBy: { id: "asc" },
    });

    return opciones.map((o) => ({
      id: `${tipoNorm}-${o.id}`,
      idOpcion: o.id,
      nombre: o.nombre,
      activa: o.activa,
    }));
  }

  async crearOpcionCatalogo(tipo, { nombre }) {
    const tipoNorm = tipo.toLowerCase().trim();
    if (!["carreras", "vinculos"].includes(tipoNorm)) {
      throw new BadRequestError("El catálogo debe ser 'carreras' o 'vinculos'.");
    }

    const nombreLimpio = nombre?.trim();
    if (!nombreLimpio) {
      throw new BadRequestError("Ingresá un nombre para la opción.");
    }

    const existe = await prisma.opcionCatalogo.findFirst({
      where: {
        catalogo: tipoNorm,
        nombre: { equals: nombreLimpio, mode: "insensitive" },
      },
    });

    if (existe) {
      throw new ConflictError("Ya existe una opción con ese nombre en el catálogo.");
    }

    const nueva = await prisma.opcionCatalogo.create({
      data: {
        catalogo: tipoNorm,
        nombre: nombreLimpio,
        activa: true,
      },
    });

    return {
      id: `${tipoNorm}-${nueva.id}`,
      idOpcion: nueva.id,
      nombre: nueva.nombre,
      activa: nueva.activa,
    };
  }

  async updateOpcionCatalogo(tipo, id, { nombre, activa }) {
    const tipoNorm = tipo.toLowerCase().trim();
    const idNum = Number(String(id).replace(`${tipoNorm}-`, ""));

    const anterior = await prisma.opcionCatalogo.findUnique({
      where: { id: idNum },
    });

    if (!anterior || anterior.catalogo !== tipoNorm) {
      throw new NotFoundError("No se encontró la opción de catálogo especificada.");
    }

    const nombreNuevo = nombre !== undefined ? nombre.trim() : anterior.nombre;
    if (!nombreNuevo) {
      throw new BadRequestError("El nombre no puede estar vacío.");
    }

    // Verificar si el nuevo nombre colisiona con otra opción
    if (nombreNuevo.toLowerCase() !== anterior.nombre.toLowerCase()) {
      const duplicado = await prisma.opcionCatalogo.findFirst({
        where: {
          catalogo: tipoNorm,
          id: { not: idNum },
          nombre: { equals: nombreNuevo, mode: "insensitive" },
        },
      });
      if (duplicado) {
        throw new ConflictError("Ya existe una opción con ese nombre en el catálogo.");
      }
    }

    const estadoActiva = activa !== undefined ? Boolean(activa) : anterior.activa;

    // Actualización atómica con propagación en cascada de renombrado si aplica
    return await prisma.$transaction(async (tx) => {
      const actualizada = await tx.opcionCatalogo.update({
        where: { id: idNum },
        data: {
          nombre: nombreNuevo,
          activa: estadoActiva,
        },
      });

      // Si se renombró, propagar a las fichas de alumnos o contactos
      if (nombreNuevo !== anterior.nombre) {
        if (tipoNorm === "carreras") {
          await tx.alumno.updateMany({
            where: { carrera: { equals: anterior.nombre, mode: "insensitive" } },
            data: { carrera: nombreNuevo },
          });
        } else if (tipoNorm === "vinculos") {
          await tx.contactoEmergencia.updateMany({
            where: { vinculo: { equals: anterior.nombre, mode: "insensitive" } },
            data: { vinculo: nombreNuevo },
          });
          await tx.alumno.updateMany({
            where: { emergenciaVinculo: { equals: anterior.nombre, mode: "insensitive" } },
            data: { emergenciaVinculo: nombreNuevo },
          });
        }
      }

      return {
        id: `${tipoNorm}-${actualizada.id}`,
        idOpcion: actualizada.id,
        nombre: actualizada.nombre,
        activa: actualizada.activa,
      };
    });
  }

  /**
   * ==========================================
   * MÉTRICAS CONSOLIDADAS DEL DASHBOARD
   * ==========================================
   */

  async getDashboardResumen(fechaRefStr = FECHA_REFERENCIA) {
    const now = new Date(`${fechaRefStr}T23:59:59.000Z`);

    const [
      habitaciones,
      asignacionesActivas,
      contratosVigentes,
      todosContratos,
      todasFacturas,
      todasMultas,
      todosReclamos,
    ] = await Promise.all([
      prisma.habitacion.findMany({ select: { idHabitacion: true, capacidadMaxima: true } }),
      prisma.habitacionAlumno.findMany({
        where: {
          fechaDesde: { lte: now },
          OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
        },
      }),
      prisma.contrato.findMany({
        where: {
          estado: "VIGENTE",
          fechaDesde: { lte: now },
          fechaHasta: { gte: now },
        },
      }),
      prisma.contrato.findMany({ select: { estado: true, fechaHasta: true } }),
      prisma.factura.findMany({
        include: { detalles: true, pagos: true },
      }),
      prisma.multa.findMany({
        select: { estadoMulta: true, monto: true, fechaVence: true },
      }),
      prisma.reclamo.findMany({
        select: { estado: true, prioridad: true },
      }),
    ]);

    // 1. Ocupación
    let capacidadTotal = 0;
    for (const h of habitaciones) {
      capacidadTotal += h.capacidadMaxima;
    }
    const camasOcupadas = asignacionesActivas.length;
    const porcentajeOcupacion = capacidadTotal > 0 ? Math.round((camasOcupadas / capacidadTotal) * 1000) / 10 : 0;

    // 2. Contratos por vencer (30 días)
    const fecha30Dias = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const contratosPorVencer = todosContratos.filter(
      (c) => c.estado === "VIGENTE" && c.fechaHasta >= now && c.fechaHasta <= fecha30Dias
    ).length;

    // 3. Facturación y Cobros
    let totalFacturado = 0;
    let totalCobrado = 0;
    let facturasPendientesCount = 0;

    for (const f of todasFacturas) {
      if (!f.fechaCancelacion) {
        const facturado = f.detalles.reduce((s, d) => s + Number(d.monto), 0);
        const cobrado = f.pagos.reduce((s, p) => s + Number(p.monto), 0);
        const credito = Number(f.creditoAplicado || 0);
        const saldo = Math.max(0, facturado - cobrado - credito);

        totalFacturado += facturado;
        totalCobrado += cobrado;
        if (saldo > 0) facturasPendientesCount++;
      }
    }

    // 4. Multas
    const multasPendientes = todasMultas.filter((m) => m.estadoMulta === "PENDIENTE").length;

    // 5. Reclamos abiertos
    const reclamosAbiertos = todosReclamos.filter(
      (r) => ["pendiente", "en_revision"].includes(r.estado)
    ).length;

    return {
      fechaReferencia: fechaRefStr,
      ocupacion: {
        capacidadTotal,
        camasOcupadas,
        habitacionesTotal: habitaciones.length,
        porcentajeOcupacion,
      },
      contratos: {
        vigentes: contratosVigentes.length,
        porVencer30Dias: contratosPorVencer,
        total: todosContratos.length,
      },
      finanzas: {
        totalFacturado: Math.round(totalFacturado * 100) / 100,
        totalCobrado: Math.round(totalCobrado * 100) / 100,
        facturasPendientes: facturasPendientesCount,
      },
      multas: {
        pendientes: multasPendientes,
      },
      reclamos: {
        abiertos: reclamosAbiertos,
        altaPrioridad: todosReclamos.filter((r) => r.prioridad === "alta" && r.estado !== "resuelto").length,
      },
    };
  }

  /**
   * ==========================================
   * ESTADO COMPLETO DEL SISTEMA (BOOTSTRAP FRONTEND)
   * ==========================================
   */
  async getEstadoCompleto(usuarioSesion = null) {
    await this.#asegurarParametros();
    await this.asegurarCatalogos();

    const esAlumno = (usuarioSesion?.rol || "").toUpperCase() === "ALUMNO";
    const alumnoId = usuarioSesion?.alumno?.idAlumno ? Number(usuarioSesion.alumno.idAlumno) : null;
    const usuarioId = usuarioSesion?.idUsuario ? Number(usuarioSesion.idUsuario) : null;

    const whereAlumno = esAlumno && alumnoId ? { idAlumno: alumnoId } : undefined;
    const whereUsuario = esAlumno && usuarioId ? { idUsuario: usuarioId } : undefined;

    // Lote 1: Catálogos, infraestructura y parámetros base
    const [
      carrerasRaw,
      vinculosRaw,
      parametrosRaw,
      tareasLimpiezaRaw,
      habitacionesRaw,
      ambientesRaw,
    ] = await Promise.all([
      prisma.opcionCatalogo.findMany({
        where: { catalogo: "carreras" },
        orderBy: { id: "asc" },
      }),
      prisma.opcionCatalogo.findMany({
        where: { catalogo: "vinculos" },
        orderBy: { id: "asc" },
      }),
      prisma.parametroSistema.findMany(),
      prisma.tareaLimpieza.findMany({ orderBy: { numero: "asc" } }),
      prisma.habitacion.findMany({ orderBy: { numeroHabitacion: "asc" } }),
      prisma.ambiente.findMany({
        include: { equipamiento: { orderBy: { idEquipamiento: "asc" } } },
        orderBy: { idAmbiente: "asc" },
      }),
    ]);

    // Lote 2: Limpieza, residentes y usuarios
    const [
      gruposRaw,
      grupoAlumnosRaw,
      grupoAmbientesRaw,
      usuariosRaw,
      alumnosRaw,
      asignacionesRaw,
    ] = await Promise.all([
      prisma.grupoDeLimpieza.findMany({ orderBy: { posicionInicial: "asc" } }),
      prisma.grupoLimpiezaAlumno.findMany({
        where: whereAlumno,
      }),
      prisma.grupoLimpiezaAmbiente.findMany({ orderBy: { fechaDesde: "asc" } }),
      prisma.usuario.findMany({
        where: whereUsuario,
        include: { rol: true },
        orderBy: { idUsuario: "asc" },
      }),
      prisma.alumno.findMany({
        where: whereAlumno,
        include: { contactosEmergencia: { orderBy: { orden: "asc" } }, usuario: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      }),
      prisma.habitacionAlumno.findMany({
        where: whereAlumno,
        orderBy: { fechaDesde: "asc" },
      }),
    ]);

    // Lote 3: Contratos, facturas, cobros, multas y reclamos
    const [
      contratosRaw,
      facturasRaw,
      pagosRaw,
      multasRaw,
      cambiosRaw,
      reclamosRaw,
    ] = await Promise.all([
      prisma.contrato.findMany({
        where: whereAlumno,
        orderBy: { fechaDesde: "asc" },
      }),
      prisma.factura.findMany({
        where: whereAlumno,
        include: { detalles: { orderBy: { orden: "asc" } } },
        orderBy: { fechaEmision: "desc" },
      }),
      prisma.pago.findMany({
        where: whereAlumno,
        orderBy: { fecha: "desc" },
      }),
      prisma.multa.findMany({
        where: whereAlumno,
        orderBy: { fechaEmision: "desc" },
      }),
      esAlumno
        ? Promise.resolve([])
        : prisma.cambioAdministrativo.findMany({
            include: { actor: true },
            orderBy: { fecha: "desc" },
            take: 100,
          }),
      prisma.reclamo.findMany({
        where: whereAlumno,
        include: { historial: { orderBy: { fecha: "asc" } } },
        orderBy: { fechaCreacion: "desc" },
      }),
    ]);

    const parametros = { ...PARAMETROS_DEFAULT };
    for (const p of parametrosRaw) {
      parametros[p.clave] = Number(p.valor);
    }

    const alumnos = alumnosRaw.map((a) => ({
      idAlumno: String(a.idAlumno),
      nombre: a.nombre,
      apellido: a.apellido,
      documento: a.documento,
      telefono: a.telefono || "",
      correo: a.correoContacto || a.usuario?.correo || "",
      estado: a.estado.toLowerCase(),
      fechaNacimiento: a.fechaNacimiento ? a.fechaNacimiento.toISOString().slice(0, 10) : undefined,
      nacionalidad: a.nacionalidad || undefined,
      domicilio: a.domicilio || undefined,
      localidad: a.localidad || undefined,
      provincia: a.provincia || undefined,
      codigoPostal: a.codigoPostal || undefined,
      institucion: a.institucion || undefined,
      carrera: a.carrera || undefined,
      anioCursado: a.anioCursado || undefined,
      cantidadMateriasCursadas: a.cantidadMateriasCursadas ?? undefined,
      legajo: a.legajo || undefined,
      observaciones: a.observaciones || undefined,
      contactosEmergencia: a.contactosEmergencia.map((c) => ({
        nombre: c.nombre,
        vinculo: c.vinculo,
        telefono: c.telefono,
      })),
    }));

    const habitaciones = habitacionesRaw.map((h) => ({
      idHabitacion: String(h.idHabitacion),
      numeroHabitacion: h.numeroHabitacion,
      pisoHabitacion: h.pisoHabitacion,
      capacidadMaxima: h.capacidadMaxima,
      descripcion: h.descripcion || `Habitación para ${h.capacidadMaxima} personas.`,
    }));

    const asignaciones = asignacionesRaw.map((ha) => ({
      idHabitacion: String(ha.idHabitacion),
      idAlumno: String(ha.idAlumno),
      fechaDesde: ha.fechaDesde.toISOString().slice(0, 10),
      fechaHasta: ha.fechaHasta ? ha.fechaHasta.toISOString().slice(0, 10) : null,
    }));

    const contratos = contratosRaw.map((c) => ({
      idContrato: String(c.idContrato),
      idAlumno: String(c.idAlumno),
      fechaDesde: c.fechaDesde.toISOString().slice(0, 10),
      fechaHasta: c.fechaHasta.toISOString().slice(0, 10),
      fechaFirma: c.fechaFirma ? c.fechaFirma.toISOString().slice(0, 10) : undefined,
      montoMensual: Number(c.montoMensual),
      depositoGarantia: Number(c.depositoGarantia),
      diaVencimientoPago: c.diaVencimientoPago,
      observaciones: c.observaciones || undefined,
      fechaCancelacion: c.fechaCancelacion ? c.fechaCancelacion.toISOString().slice(0, 10) : undefined,
      motivoCancelacion: c.motivoCancelacion || undefined,
    }));

    const facturas = facturasRaw.map((f) => ({
      idFactura: String(f.idFactura),
      idContrato: String(f.idContrato),
      idAlumno: f.idAlumno ? String(f.idAlumno) : undefined,
      titular: f.titular,
      documento: f.documento,
      periodo: f.periodo,
      fechaEmision: f.fechaEmision.toISOString().slice(0, 10),
      fechaVence: f.fechaVence.toISOString().slice(0, 10),
      fechaCancelacion: f.fechaCancelacion ? f.fechaCancelacion.toISOString().slice(0, 10) : undefined,
      motivoCancelacion: f.motivoCancelacion || undefined,
      idFacturaOrigen: f.idFacturaOrigen ? String(f.idFacturaOrigen) : undefined,
      creditoAplicado: Number(f.creditoAplicado || 0),
      detalles: f.detalles.map((d) => ({
        idDetalle: String(d.idDetalle),
        concepto: d.concepto,
        monto: Number(d.monto),
        idMulta: d.idMulta ? String(d.idMulta) : undefined,
      })),
    }));

    const pagos = pagosRaw.map((p) => ({
      idPago: String(p.idPago),
      idAlumno: String(p.idAlumno),
      idFactura: p.idFactura ? String(p.idFactura) : undefined,
      monto: Number(p.monto),
      fecha: p.fecha.toISOString().slice(0, 10),
      concepto: p.concepto,
      medio: p.medio || undefined,
      referencia: p.referencia || undefined,
    }));

    const multas = multasRaw.map((m) => {
      let estado = m.estadoMulta.toLowerCase();
      if (estado === "anulada") estado = "anulada";
      else if (estado === "pagada") estado = "pagada";
      else estado = "pendiente";

      return {
        idMulta: String(m.idMulta),
        idAlumno: String(m.idAlumno),
        monto: Number(m.monto),
        fechaEmision: m.fechaEmision.toISOString().slice(0, 10),
        fechaVence: m.fechaVence.toISOString().slice(0, 10),
        estado,
        fechaPago: m.fechaPago ? m.fechaPago.toISOString().slice(0, 10) : null,
        tipo: m.tipo || "leve",
        motivo: m.motivo || "",
        observaciones: m.observaciones || undefined,
        huboDanios: Boolean(m.huboDanios),
        detalleDanios: m.detalleDanios || undefined,
        montoSancion: Number(m.montoSancion || m.monto),
        montoDanios: Number(m.montoDanios || 0),
      };
    });

    const grupos = gruposRaw.map((g) => ({
      idGrupoLimpieza: String(g.idGrupoLimpieza),
      nombreDelGrupo: g.nombreDelGrupo,
      tareaInicial: g.posicionInicial,
    }));

    const grupoAlumnos = grupoAlumnosRaw.map((ga) => ({
      idGrupoLimpieza: String(ga.idGrupoLimpieza),
      idAlumno: String(ga.idAlumno),
    }));

    const ambientes = ambientesRaw.map((amb) => ({
      idAmbiente: String(amb.idAmbiente),
      ambiente: amb.nombre,
      tipo: amb.tipo || undefined,
      ubicacion: amb.ubicacion || undefined,
      descripcion: amb.descripcion || undefined,
      tareas: amb.tareas || "",
      equipamiento: amb.equipamiento.map((e) => ({
        nombre: e.nombre,
        cantidad: e.cantidad,
      })),
    }));

    const grupoAmbientes = grupoAmbientesRaw.map((gab) => ({
      idGrupoLimpieza: String(gab.idGrupoLimpieza),
      idAmbiente: String(gab.idAmbiente),
      fechaDesde: gab.fechaDesde.toISOString().slice(0, 10),
      fechaHasta: gab.fechaHasta ? gab.fechaHasta.toISOString().slice(0, 10) : null,
    }));

    const usuarios = usuariosRaw.map((u) => ({
      idUsuario: String(u.idUsuario),
      idAlumno: u.idAlumno ? String(u.idAlumno) : undefined,
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      documento: u.documento || undefined,
      telefono: u.telefono || undefined,
      correo: u.correo,
      rol: u.rol.rol.toLowerCase() === "administrador" ? "administrador" : "alumno",
      estado: u.estado,
      gestionaAdministradores: Boolean(u.gestionaAdministradores),
      fechaAlta: u.fechaAlta ? u.fechaAlta.toISOString().slice(0, 10) : undefined,
    }));

    const tareasLimpieza = tareasLimpiezaRaw.map((t) => ({
      numero: t.numero,
      nombre: t.nombre,
      enRotacion: t.enRotacion,
      tareas: t.actividades || [],
    }));

    const carreras = carrerasRaw.map((c) => ({
      id: `carreras-${c.id}`,
      nombre: c.nombre,
      activa: c.activa,
    }));

    const vinculos = vinculosRaw.map((v) => ({
      id: `vinculos-${v.id}`,
      nombre: v.nombre,
      activa: v.activa,
    }));

    const historialAdministrativo = cambiosRaw.map((c) => ({
      id: String(c.idCambio),
      idActor: String(c.idActor),
      fecha: c.fecha.toISOString(),
      seccion: c.seccion,
      accion: c.accion,
      detalle: c.detalle,
    }));

    const reclamos = reclamosRaw.map((r) => ({
      idReclamo: String(r.idReclamo),
      idAlumno: String(r.idAlumno),
      tipo: r.tipo,
      categoria: r.categoria,
      asunto: r.asunto,
      descripcion: r.descripcion,
      ubicacion: r.ubicacion,
      detalleUbicacion: r.detalleUbicacion || undefined,
      prioridad: r.prioridad,
      estado: r.estado,
      fechaCreacion: r.fechaCreacion.toISOString(),
      fechaActualizacion: r.fechaActualizacion.toISOString(),
      historial: r.historial.map((h) => ({
        id: String(h.idSeguimiento),
        idAutor: h.idAutor ? String(h.idAutor) : undefined,
        autor: h.autor,
        rol: h.rol,
        tipo: h.tipo,
        mensaje: h.mensaje,
        estado: h.estado || undefined,
        fecha: h.fecha.toISOString(),
      })),
    }));

    return {
      carreras,
      vinculos,
      reclamos,
      facturas,
      habitaciones,
      alumnos,
      asignaciones,
      contratos,
      pagos,
      multas,
      tareasLimpieza,
      grupos,
      grupoAlumnos,
      ambientes,
      grupoAmbientes,
      parametros,
      historialAdministrativo,
      usuarios,
    };
  }
}

export const administracionService = new AdministracionService();
export default administracionService;
