import { pagoService } from "../services/pago.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Cobros y Pagos
 * Atiende las solicitudes HTTP de registro de cobros, consulta de recibos y arqueos.
 */
class PagoController {
  /**
   * POST /api/pagos / /api/cobros
   * Registra un pago completo o parcial vinculado a una factura.
   */
  registrar = async (req, res, next) => {
    try {
      const resultado = await pagoService.registrarCobro(req.body);
      return successResponse(
        res,
        resultado,
        "Cobro registrado exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/pagos / /api/cobros
   * Obtiene la lista paginada de cobros con filtros y total recaudado.
   */
  getAll = async (req, res, next) => {
    try {
      const result = await pagoService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de cobros obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/pagos/:id
   * Obtiene el detalle de un cobro por su ID.
   */
  getById = async (req, res, next) => {
    try {
      const pago = await pagoService.getById(req.params.id);
      return successResponse(
        res,
        pago,
        "Detalle del cobro obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const pagoController = new PagoController();
export default pagoController;
