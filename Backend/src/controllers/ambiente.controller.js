import { limpiezaService } from "../services/limpieza.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Ambientes Comunes
 * Maneja las solicitudes HTTP para catálogo de áreas y sus tareas de limpieza.
 */
class AmbienteController {
  /**
   * POST /api/ambientes
   */
  create = async (req, res, next) => {
    try {
      const nuevoAmbiente = await limpiezaService.createAmbiente(req.body);
      return successResponse(
        res,
        nuevoAmbiente,
        "Ambiente registrado exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/ambientes
   */
  getAll = async (req, res, next) => {
    try {
      const result = await limpiezaService.getAllAmbientes(req.query);
      return successResponse(
        res,
        result,
        "Listado de ambientes obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/ambientes/:id
   */
  getById = async (req, res, next) => {
    try {
      const ambiente = await limpiezaService.getAmbienteById(req.params.id);
      return successResponse(
        res,
        ambiente,
        "Detalle del ambiente obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/ambientes/:id
   */
  update = async (req, res, next) => {
    try {
      const ambienteActualizado = await limpiezaService.updateAmbiente(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        ambienteActualizado,
        "Ambiente actualizado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/ambientes/:id
   */
  delete = async (req, res, next) => {
    try {
      const ambienteEliminado = await limpiezaService.deleteAmbiente(req.params.id);
      return successResponse(
        res,
        ambienteEliminado,
        "Ambiente eliminado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const ambienteController = new AmbienteController();
export default ambienteController;

