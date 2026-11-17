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
      const userId = req.user?.idUsuario || req.query.idUsuario;
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
      const userId = req.user?.idUsuario || req.body.idUsuario;
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
      const userId = req.user?.idUsuario || req.body.idUsuario;
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
}

export const administracionController = new AdministracionController();
export default administracionController;
