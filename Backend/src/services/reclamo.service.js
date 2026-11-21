import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";
import { administracionService } from "./administracion.service.js";

/**
 * Normaliza cadenas para búsqueda insensible a mayúsculas y acentos.
 */
function normalizar(str = "") {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Capa de Servicio: Reclamos y Seguimientos
 * Gestiona presentaciones, solicitudes de mantenimiento, convivencia y su bitácora de seguimiento.
 */
class ReclamoService {
  /**
   * Determina si una presentación se considera abierta (admite comentarios y cambios).
   */
  #esAbierto(estado) {
    return ["pendiente", "en_revision"].includes(estado);
  }

  /**
   * Da formato estándar a un Reclamo con su historial y alumno asociado.
   */
  #formatearReclamo(reclamo) {
    if (!reclamo) return null;

    return {
      idReclamo: reclamo.idReclamo,
      idAlumno: reclamo.idAlumno,
      tipo: reclamo.tipo,
      categoria: reclamo.categoria,
      asunto: reclamo.asunto,
      descripcion: reclamo.descripcion,
      ubicacion: reclamo.ubicacion,
      detalleUbicacion: reclamo.detalleUbicacion || "",
      prioridad: reclamo.prioridad,
      estado: reclamo.estado,
      esAbierto: this.#esAbierto(reclamo.estado),
      fechaCreacion: reclamo.fechaCreacion ? reclamo.fechaCreacion.toISOString() : null,
      fechaActualizacion: reclamo.fechaActualizacion ? reclamo.fechaActualizacion.toISOString() : null,
      alumno: reclamo.alumno
        ? {
            idAlumno: reclamo.alumno.idAlumno,
            nombre: reclamo.alumno.nombre,
            apellido: reclamo.alumno.apellido,
            documento: reclamo.alumno.documento,
            telefono: reclamo.alumno.telefono,
            estado: reclamo.alumno.estado,
          }
        : undefined,
      historial: (reclamo.historial || []).map((h) => ({
        id: String(h.idSeguimiento),
        idSeguimiento: h.idSeguimiento,
        idReclamo: h.idReclamo,
        idAutor: h.idAutor,
        autor: h.autor,
        rol: h.rol,
        tipo: h.tipo,
        mensaje: h.mensaje,
        estado: h.estado,
        fecha: h.fecha ? h.fecha.toISOString() : null,
      })),
    };
  }

  /**
   * Crea una nueva presentación y genera el primer hito en el historial de seguimiento.
   */
  async create(data, usuarioSesion = null) {
    const alumnoId = Number(data.idAlumno);

    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: alumnoId },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró el alumno con ID: ${alumnoId}`);
    }

    if (alumno.estado?.toLowerCase() !== "activo") {
      throw new BadRequestError("Solo un alumno con estado activo puede crear una presentación.");
    }

    const autorNombre = data.autor?.trim() || usuarioSesion?.nombre || `${alumno.nombre} ${alumno.apellido}`;
    const autorId = data.idAutor ? Number(data.idAutor) : usuarioSesion?.idUsuario || null;
    const autorRol = usuarioSesion?.rol || "alumno";

    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoReclamo = await tx.reclamo.create({
        data: {
          idAlumno: alumnoId,
          tipo: data.tipo || "reclamo",
          categoria: data.categoria || "mantenimiento",
          asunto: data.asunto.trim(),
          descripcion: data.descripcion.trim(),
          ubicacion: data.ubicacion.trim(),
          detalleUbicacion: data.detalleUbicacion?.trim() || "",
          prioridad: data.prioridad || "normal",
          estado: "pendiente",
        },
      });

      // Crear hito inicial de seguimiento
      await tx.seguimientoReclamo.create({
        data: {
          idReclamo: nuevoReclamo.idReclamo,
          idAutor: autorId,
          autor: autorNombre,
          rol: autorRol,
          tipo: "creacion",
          mensaje: "Presentación registrada y pendiente de revisión por administración.",
          estado: "pendiente",
        },
      });

      const reclamoCreado = await tx.reclamo.findUnique({
        where: { idReclamo: nuevoReclamo.idReclamo },
        include: {
          alumno: true,
          historial: { orderBy: { fecha: "asc" } },
        },
      });

      return this.#formatearReclamo(reclamoCreado);
    });

    void administracionService.notificarAdministradores({
      claveEvento: "reclamo_creado",
      tipo: data.prioridad === "alta" ? "alerta" : "info",
      titulo: `Nueva presentación: ${data.asunto.trim()}`,
      detalle: `El alumno ${alumno.nombre} ${alumno.apellido} ha registrado un/a ${data.tipo || "reclamo"} en ${data.ubicacion.trim()}.`,
      destino: `/reclamos/${resultado.idReclamo}`,
    });

    return resultado;
  }

  /**
   * Obtiene la lista paginada y filtrada de reclamos con métricas agregadas.
   */
  async getAll({
    page = 1,
    limit = 10,
    idAlumno,
    vista,
    estado,
    categoria,
    prioridad,
    tipo,
    search,
    busqueda,
    orden = "recientes",
  } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (idAlumno) {
      where.idAlumno = Number(idAlumno);
    }

    if (vista === "abiertos") {
      where.estado = { in: ["pendiente", "en_revision"] };
    } else if (vista === "cerrados") {
      where.estado = { in: ["resuelto", "rechazado", "cancelado"] };
    }

    if (estado && estado !== "todos") {
      where.estado = estado.toLowerCase();
    }

    if (categoria && categoria !== "todas") {
      where.categoria = categoria.toLowerCase();
    }

    if (prioridad && prioridad !== "todas") {
      where.prioridad = prioridad.toLowerCase();
    }

    if (tipo && tipo !== "todos") {
      where.tipo = tipo.toLowerCase();
    }

    const terminoBusqueda = (search || busqueda || "").trim();
    if (terminoBusqueda) {
      where.OR = [
        { asunto: { contains: terminoBusqueda, mode: "insensitive" } },
        { descripcion: { contains: terminoBusqueda, mode: "insensitive" } },
        { ubicacion: { contains: terminoBusqueda, mode: "insensitive" } },
        { detalleUbicacion: { contains: terminoBusqueda, mode: "insensitive" } },
        { alumno: { nombre: { contains: terminoBusqueda, mode: "insensitive" } } },
        { alumno: { apellido: { contains: terminoBusqueda, mode: "insensitive" } } },
        { alumno: { documento: { contains: terminoBusqueda, mode: "insensitive" } } },
      ];
    }

    // Configurar ordenación
    let orderBy = [{ fechaActualizacion: "desc" }, { idReclamo: "desc" }];
    if (orden === "antiguos") {
      orderBy = [{ fechaCreacion: "asc" }, { idReclamo: "asc" }];
    } else if (orden === "prioridad") {
      // Ordena por estado primero (pendientes y en revisión antes de resueltos), luego por fecha
      orderBy = [{ prioridad: "desc" }, { fechaActualizacion: "desc" }];
    }

    const [total, reclamos, todosReclamos] = await Promise.all([
      prisma.reclamo.count({ where }),
      prisma.reclamo.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          alumno: {
            select: {
              idAlumno: true,
              nombre: true,
              apellido: true,
              documento: true,
              telefono: true,
              estado: true,
            },
          },
          historial: {
            orderBy: { fecha: "asc" },
          },
        },
      }),
      prisma.reclamo.findMany({
        where: idAlumno ? { idAlumno: Number(idAlumno) } : {},
        select: { estado: true, categoria: true, prioridad: true },
      }),
    ]);

    // Resumen de métricas
    let totalAbiertos = 0;
    let totalCerrados = 0;
    const conteoPorEstado = {
      pendiente: 0,
      en_revision: 0,
      resuelto: 0,
      rechazado: 0,
      cancelado: 0,
    };
    const conteoPorCategoria = {
      mantenimiento: 0,
      limpieza: 0,
      convivencia: 0,
      administracion: 0,
      otro: 0,
    };

    for (const r of todosReclamos) {
      if (this.#esAbierto(r.estado)) {
        totalAbiertos++;
      } else {
        totalCerrados++;
      }
      if (conteoPorEstado[r.estado] !== undefined) {
        conteoPorEstado[r.estado]++;
      }
      if (conteoPorCategoria[r.categoria] !== undefined) {
        conteoPorCategoria[r.categoria]++;
      }
    }

    return {
      reclamos: reclamos.map((r) => this.#formatearReclamo(r)),
      resumen: {
        totalRegistros: total,
        totalAbiertos,
        totalCerrados,
        conteoPorEstado,
        conteoPorCategoria,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene el detalle completo de un reclamo por su ID con todo el historial de seguimiento.
   */
  async getById(id) {
    const reclamoId = Number(id);

    const reclamo = await prisma.reclamo.findUnique({
      where: { idReclamo: reclamoId },
      include: {
        alumno: {
          include: {
            habitacionesAlumnos: {
              where: { fechaHasta: null },
              include: { habitacion: true },
            },
          },
        },
        historial: {
          orderBy: { fecha: "asc" },
          include: {
            usuarioAutor: {
              select: { idUsuario: true, nombre: true, rol: true },
            },
          },
        },
      },
    });

    if (!reclamo) {
      throw new NotFoundError(`No se encontró ninguna presentación con el ID: ${id}`);
    }

    return this.#formatearReclamo(reclamo);
  }

  /**
   * Registra una respuesta o cambio de estado en la bitácora de seguimiento del reclamo.
   */
  async responder(id, data, usuarioSesion = null) {
    const reclamoId = Number(id);

    const reclamo = await prisma.reclamo.findUnique({
      where: { idReclamo: reclamoId },
    });

    if (!reclamo) {
      throw new NotFoundError(`No se encontró ninguna presentación con el ID: ${id}`);
    }

    if (!this.#esAbierto(reclamo.estado)) {
      throw new ConflictError("Esta presentación ya está cerrada y no admite cambios.");
    }

    const rol = data.rol || usuarioSesion?.rol || "administrador";

    // Validar permisos según el rol
    if (data.estado !== undefined && data.estado !== reclamo.estado) {
      if (rol === "alumno" && data.estado !== "cancelado") {
        throw new BadRequestError("Solo administración puede gestionar el estado de la presentación.");
      }
      if (rol === "administrador" && !["pendiente", "en_revision", "resuelto", "rechazado"].includes(data.estado)) {
        throw new BadRequestError("El estado especificado no es válido para administración.");
      }
    }

    const nuevoEstado = data.estado || reclamo.estado;
    const cambioEstado = Boolean(data.estado && data.estado !== reclamo.estado);
    const tipoSeguimiento = cambioEstado ? "estado" : "comentario";

    const autorNombre = data.autor?.trim() || usuarioSesion?.nombre || (rol === "alumno" ? "Alumno" : "Administración");
    const autorId = data.idAutor ? Number(data.idAutor) : usuarioSesion?.idUsuario || null;

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Agregar hito al historial
      await tx.seguimientoReclamo.create({
        data: {
          idReclamo: reclamoId,
          idAutor: autorId,
          autor: autorNombre,
          rol,
          tipo: tipoSeguimiento,
          mensaje: data.mensaje.trim(),
          estado: data.estado || null,
        },
      });

      // 2. Actualizar estado y fechaActualizacion del reclamo
      const reclamoActualizado = await tx.reclamo.update({
        where: { idReclamo: reclamoId },
        data: {
          estado: nuevoEstado,
          fechaActualizacion: new Date(),
        },
        include: {
          alumno: true,
          historial: { orderBy: { fecha: "asc" } },
        },
      });

      return this.#formatearReclamo(reclamoActualizado);
    });

    if (rol === "alumno") {
      void administracionService.notificarAdministradores({
        claveEvento: "reclamo_comentario",
        tipo: "info",
        titulo: `Nuevo mensaje en presentación #${reclamo.idReclamo}`,
        detalle: `${autorNombre}: ${data.mensaje.trim().slice(0, 150)}`,
        destino: `/reclamos/${reclamo.idReclamo}`,
      });
    } else {
      void administracionService.notificarAlumno(reclamo.idAlumno, {
        claveEvento: "reclamo_respuesta",
        tipo: "info",
        titulo: `Respuesta de administración en tu presentación: ${reclamo.asunto}`,
        detalle: `${autorNombre}: ${data.mensaje.trim().slice(0, 150)} (Estado: ${nuevoEstado})`,
        destino: `/estudiante/reclamos/${reclamo.idReclamo}`,
      });
    }

    return resultado;
  }

  /**
   * Elimina un reclamo y su historial (para administración / limpieza).
   */
  async delete(id) {
    const reclamoId = Number(id);

    const reclamo = await prisma.reclamo.findUnique({
      where: { idReclamo: reclamoId },
    });

    if (!reclamo) {
      throw new NotFoundError(`No se encontró ninguna presentación con el ID: ${id}`);
    }

    return await prisma.reclamo.delete({
      where: { idReclamo: reclamoId },
    });
  }
}

export const reclamoService = new ReclamoService();
export default reclamoService;
