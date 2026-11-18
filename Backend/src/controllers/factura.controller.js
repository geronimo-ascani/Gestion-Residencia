import { facturaService } from "../services/factura.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Facturación
 * Atiende las solicitudes HTTP relativas a emisión, listado, métricas y detalles de facturas.
 */
class FacturaController {
  /**
   * POST /api/facturas
   * Emite una factura individual para un contrato en un período determinado.
   */
  generar = async (req, res, next) => {
    try {
      const factura = await facturaService.generarFactura(req.body);
      return successResponse(
        res,
        factura,
        "Factura emitida exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/facturas/generar-mes
   * Genera masivamente las facturas del período para todos los contratos vigentes.
   */
  generarMes = async (req, res, next) => {
    try {
      const resultado = await facturaService.generarFacturasMes(req.body);
      return successResponse(
        res,
        resultado,
        "Proceso de facturación mensual completado",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/facturas
   * Obtiene la lista paginada de facturas con filtros, montos y estado dinámico.
   */
  getAll = async (req, res, next) => {
    try {
      const result = await facturaService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de facturas obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/facturas/:id
   * Obtiene el detalle de una factura con sus renglones y cobros registrados.
   */
  getById = async (req, res, next) => {
    try {
      const factura = await facturaService.getById(req.params.id);
      return successResponse(
        res,
        factura,
        "Detalle de la factura obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/facturas/:id
   * Elimina una factura si no tiene cobros o pagos asociados.
   */
  delete = async (req, res, next) => {
    try {
      const facturaEliminada = await facturaService.delete(req.params.id);
      return successResponse(
        res,
        facturaEliminada,
        "Factura eliminada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const facturaController = new FacturaController();
export default facturaController;
