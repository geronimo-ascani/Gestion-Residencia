import { prisma } from "../config/database.js";
import { NotFoundError, BadRequestError } from "../utils/customErrors.js";

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

  /**
   * Inicializa los parámetros del sistema si aún no existen en la base de datos.
   */
  async #asegurarParametros() {
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
}

export const administracionService = new AdministracionService();
export default administracionService;
