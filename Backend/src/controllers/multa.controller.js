import { multaService } from "../services/multa.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Multa
 * Maneja las solicitudes HTTP para emisión, seguimiento y cobro de multas.
 */
class MultaController {
  /**
   * POST /api/multas
   */
  create = async (req, res, next) => {
    try {
      const nuevaMulta = await multaService.create(req.body);
      return successResponse(
        res,
        nuevaMulta,
        "Multa registrada exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/multas
   */
  getAll = async (req, res, next) => {
    try {
      const result = await multaService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de multas obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/multas/:id
   */
  getById = async (req, res, next) => {
    try {
      const multa = await multaService.getById(req.params.id);
      return successResponse(
        res,
        multa,
        "Detalle de la multa obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/multas/:id
   */
  update = async (req, res, next) => {
    try {
      const multaActualizada = await multaService.update(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        multaActualizada,
        "Multa actualizada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH /api/multas/:id/estado
   */
  cambiarEstado = async (req, res, next) => {
    try {
      const multaActualizada = await multaService.cambiarEstado(
        req.params.id,
        req.body.estadoMulta
      );
      return successResponse(
        res,
        multaActualizada,
        `Estado de la multa actualizado a '${req.body.estadoMulta}' con éxito`,
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/multas/:id/pagar
   */
  registrarPago = async (req, res, next) => {
    try {
      const multaPagada = await multaService.registrarPago(req.params.id);
      return successResponse(
        res,
        multaPagada,
        "Pago de multa registrado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/multas/:id
   */
  delete = async (req, res, next) => {
    try {
      const multaEliminada = await multaService.delete(req.params.id);
      return successResponse(
        res,
        multaEliminada,
        "Multa eliminada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const multaController = new MultaController();
export default multaController;

