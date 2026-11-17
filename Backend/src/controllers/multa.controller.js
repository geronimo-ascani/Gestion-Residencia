import { multaService } from "../services/multa.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Multa
 * Maneja las solicitudes HTTP para emisión, seguimiento, prórroga y cobro de sanciones.
 */
class MultaController {
  /**
   * POST /api/multas
   */
  emitir = async (req, res, next) => {
    try {
      const multas = await multaService.emitir(req.body);
      return successResponse(
        res,
        multas,
        "Multa(s) registrada(s) exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  create = this.emitir;

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
   * POST /api/multas/:id/prorrogar
   */
  prorrogar = async (req, res, next) => {
    try {
      const multaProrrogada = await multaService.prorrogar(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        multaProrrogada,
        "Prórroga de vencimiento aplicada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/multas/:id/anular
   */
  anular = async (req, res, next) => {
    try {
      const multaAnulada = await multaService.anular(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        multaAnulada,
        "Multa anulada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH /api/multas/:id/estado (compatibilidad)
   */
  cambiarEstado = async (req, res, next) => {
    try {
      const estado = (req.body.estadoMulta || req.body.estado || "").toUpperCase();
      let resultado;
      if (estado === "PAGADA") {
        resultado = await multaService.registrarPago(req.params.id, req.body);
      } else if (estado === "ANULADA") {
        resultado = await multaService.anular(req.params.id, { motivo: req.body.motivo });
      } else {
        resultado = await multaService.update(req.params.id, { estadoMulta: estado });
      }
      return successResponse(
        res,
        resultado,
        `Estado de la multa actualizado a '${estado}' con éxito`,
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
      const multaPagada = await multaService.registrarPago(req.params.id, req.body);
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
