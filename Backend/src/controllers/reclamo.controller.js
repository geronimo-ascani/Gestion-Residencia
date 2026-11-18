import { reclamoService } from "../services/reclamo.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Reclamos y Solicitudes
 * Maneja las peticiones HTTP para creación, seguimiento y resolución de presentaciones.
 */
class ReclamoController {
  /**
   * POST /api/reclamos
   */
  create = async (req, res, next) => {
    try {
      const nuevoReclamo = await reclamoService.create(req.body, req.user);
      return successResponse(
        res,
        nuevoReclamo,
        "Presentación registrada exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/reclamos
   */
  getAll = async (req, res, next) => {
    try {
      const result = await reclamoService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de presentaciones obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/reclamos/:id
   */
  getById = async (req, res, next) => {
    try {
      const reclamo = await reclamoService.getById(req.params.id);
      return successResponse(
        res,
        reclamo,
        "Detalle de la presentación obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/reclamos/:id/respuestas o POST /api/reclamos/:id/responder
   */
  responder = async (req, res, next) => {
    try {
      const actualizado = await reclamoService.responder(
        req.params.id,
        req.body,
        req.user
      );
      return successResponse(
        res,
        actualizado,
        "Respuesta y seguimiento registrados con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/reclamos/:id
   */
  delete = async (req, res, next) => {
    try {
      const eliminado = await reclamoService.delete(req.params.id);
      return successResponse(
        res,
        eliminado,
        "Presentación eliminada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const reclamoController = new ReclamoController();
export default reclamoController;
