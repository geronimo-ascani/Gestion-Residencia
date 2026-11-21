import { administracionService } from "../services/administracion.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Parámetros del Sistema, Auditoría y Notificaciones
 */
class AdministracionController {
  /**
   * GET /api/parametros
   */
  getParametros = async (req, res, next) => {
    try {
      const parametros = await administracionService.getParametros();
      return successResponse(
        res,
        parametros,
        "Parámetros del sistema obtenidos con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/parametros
   */
  updateParametros = async (req, res, next) => {
    try {
      const actorId = req.user?.idUsuario || null;
      const parametros = await administracionService.updateParametros(
        req.body,
        actorId
      );
      return successResponse(
        res,
        parametros,
        "Parámetros del sistema actualizados con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/administracion/historial (o /api/auditoria)
   */
  getAllCambios = async (req, res, next) => {
    try {
      const historial = await administracionService.getAllCambios(req.query);
      return successResponse(
        res,
        historial,
        "Historial administrativo obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/administracion/historial
   */
  registrarCambio = async (req, res, next) => {
    try {
      const actorId = req.body.idActor || req.user?.idUsuario;
      const cambio = await administracionService.registrarCambio({
        ...req.body,
        idActor: actorId,
      });
      return successResponse(
        res,
        cambio,
        "Cambio administrativo registrado con éxito",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/notificaciones
   */
  getNotificaciones = async (req, res, next) => {
    try {
      let userId = req.user?.idUsuario || req.query.idUsuario;
      const rol = (req.user?.rol || "").toUpperCase();
      if (rol === "ALUMNO" && req.user?.idUsuario) {
        userId = req.user.idUsuario;
      }
      if (!userId) {
        return res.status(400).json({ status: "error", message: "Debe estar autenticado o indicar idUsuario" });
      }
      const data = await administracionService.getNotificacionesUsuario(
        userId,
        { soloNoLeidas: req.query.soloNoLeidas === "true" }
      );
      return successResponse(
        res,
        data,
        "Notificaciones obtenidas con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/notificaciones
   */
  crearNotificacion = async (req, res, next) => {
    try {
      const notificacion = await administracionService.crearNotificacion(req.body);
      return successResponse(
        res,
        notificacion,
        "Notificación emitida con éxito",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH /api/notificaciones/:id/leida
   */
  marcarLeida = async (req, res, next) => {
    try {
      let userId = req.user?.idUsuario || req.body.idUsuario;
      const rol = (req.user?.rol || "").toUpperCase();
      if (rol === "ALUMNO" && req.user?.idUsuario) {
        userId = req.user.idUsuario;
      }
      const notif = await administracionService.marcarLeida(req.params.id, userId);
      return successResponse(
        res,
        notif,
        "Notificación marcada como leída",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/notificaciones/marcar-todas-leidas
   */
  marcarTodasLeidas = async (req, res, next) => {
    try {
      let userId = req.user?.idUsuario || req.body.idUsuario;
      const rol = (req.user?.rol || "").toUpperCase();
      if (rol === "ALUMNO" && req.user?.idUsuario) {
        userId = req.user.idUsuario;
      }
      const resultado = await administracionService.marcarTodasLeidas(userId);
      return successResponse(
        res,
        resultado,
        "Todas las notificaciones fueron marcadas como leídas",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * ==========================================
   * GESTIÓN DE ADMINISTRADORES Y CUENTAS
   * ==========================================
   */

  getAdministradores = async (req, res, next) => {
    try {
      const resultado = await administracionService.getAdministradores(req.query);
      return successResponse(res, resultado, "Lista de administradores obtenida con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  getAdministradorById = async (req, res, next) => {
    try {
      const admin = await administracionService.getAdministradorById(req.params.id);
      return successResponse(res, admin, "Perfil de administrador obtenido con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  crearAdministrador = async (req, res, next) => {
    try {
      const nuevoAdmin = await administracionService.crearAdministrador(req.body);
      return successResponse(res, nuevoAdmin, "Administrador creado exitosamente", 201);
    } catch (error) {
      return next(error);
    }
  };

  updateAdministrador = async (req, res, next) => {
    try {
      const actualizado = await administracionService.updateAdministrador(req.params.id, req.body);
      return successResponse(res, actualizado, "Administrador actualizado con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  cambiarEstadoCuenta = async (req, res, next) => {
    try {
      const actorId = req.user?.idUsuario;
      const resultado = await administracionService.cambiarEstadoCuenta(
        req.params.id,
        req.body,
        actorId
      );
      return successResponse(
        res,
        resultado,
        req.body.suspender ? "Cuenta suspendida exitosamente" : "Cuenta reactivada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * ==========================================
   * CATÁLOGOS DINÁMICOS
   * ==========================================
   */

  getCatalogo = async (req, res, next) => {
    try {
      const opciones = await administracionService.getCatalogo(req.params.tipo);
      return successResponse(res, opciones, "Opciones de catálogo obtenidas con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  crearOpcionCatalogo = async (req, res, next) => {
    try {
      const nueva = await administracionService.crearOpcionCatalogo(req.params.tipo, req.body);
      return successResponse(res, nueva, "Opción creada con éxito en el catálogo", 201);
    } catch (error) {
      return next(error);
    }
  };

  updateOpcionCatalogo = async (req, res, next) => {
    try {
      const actualizada = await administracionService.updateOpcionCatalogo(
        req.params.tipo,
        req.params.id,
        req.body
      );
      return successResponse(res, actualizada, "Opción de catálogo actualizada con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * ==========================================
   * MÉTRICAS CONSOLIDADAS DEL DASHBOARD
   * ==========================================
   */

  getDashboardResumen = async (req, res, next) => {
    try {
      const resumen = await administracionService.getDashboardResumen(req.query.fecha);
      return successResponse(res, resumen, "Resumen del panel obtenido con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/estado o /api/bootstrap
   * Retorna el estado completo del sistema desde la base de datos para la hidratación del frontend.
   */
  getEstadoCompleto = async (req, res, next) => {
    try {
      const estado = await administracionService.getEstadoCompleto(req.user);
      return successResponse(res, estado, "Estado completo del sistema obtenido con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };
}

export const administracionController = new AdministracionController();
export default administracionController;
