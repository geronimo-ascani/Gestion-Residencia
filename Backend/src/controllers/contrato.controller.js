import { contratoService } from "../services/contrato.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Contrato
 * Maneja las solicitudes HTTP para contratos de alumnos.
 */
class ContratoController {
  /**
   * POST /api/contratos
   */
  create = async (req, res, next) => {
    try {
      const nuevoContrato = await contratoService.create(req.body);
      return successResponse(
        res,
        nuevoContrato,
        "Contrato registrado exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/contratos
   */
  getAll = async (req, res, next) => {
    try {
      const result = await contratoService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de contratos obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/contratos/:id
   */
  getById = async (req, res, next) => {
    try {
      const contrato = await contratoService.getById(req.params.id);
      return successResponse(
        res,
        contrato,
        "Detalle del contrato obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/contratos/:id
   */
  update = async (req, res, next) => {
    try {
      const contratoActualizado = await contratoService.update(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        contratoActualizado,
        "Contrato actualizado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH /api/contratos/:id/estado
   */
  cambiarEstado = async (req, res, next) => {
    try {
      const contratoActualizado = await contratoService.cambiarEstado(
        req.params.id,
        req.body.estado
      );
      return successResponse(
        res,
        contratoActualizado,
        `Estado del contrato actualizado a '${req.body.estado}' con éxito`,
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/contratos/:id
   */
  delete = async (req, res, next) => {
    try {
      const contratoEliminado = await contratoService.delete(req.params.id);
      return successResponse(
        res,
        contratoEliminado,
        "Contrato eliminado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const contratoController = new ContratoController();
export default contratoController;
