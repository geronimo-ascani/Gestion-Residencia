import { cuotaService } from "../services/cuota.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Cuota Mensual
 * Maneja las solicitudes HTTP para emisión, consulta y cobro de cuotas.
 */
class CuotaController {
  /**
   * POST /api/cuotas
   */
  create = async (req, res, next) => {
    try {
      const nuevaCuota = await cuotaService.create(req.body);
      return successResponse(
        res,
        nuevaCuota,
        "Cuota mensual emitida exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/cuotas/generar-mes
   */
  generarCuotasMes = async (req, res, next) => {
    try {
      const resultado = await cuotaService.generarCuotasMes(req.body);
      return successResponse(
        res,
        resultado,
        `Generación masiva completada: ${resultado.generadas} emitidas, ${resultado.omitidas} omitidas`,
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/cuotas
   */
  getAll = async (req, res, next) => {
    try {
      const result = await cuotaService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de cuotas obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/cuotas/:id
   */
  getById = async (req, res, next) => {
    try {
      const cuota = await cuotaService.getById(req.params.id);
      return successResponse(
        res,
        cuota,
        "Detalle de la cuota obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/cuotas/:id
   */
  update = async (req, res, next) => {
    try {
      const cuotaActualizada = await cuotaService.update(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        cuotaActualizada,
        "Cuota actualizada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/cuotas/:id/pagar
   */
  registrarPago = async (req, res, next) => {
    try {
      const cuotaPagada = await cuotaService.registrarPago(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        cuotaPagada,
        "Pago de cuota registrado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/cuotas/:id
   */
  delete = async (req, res, next) => {
    try {
      const cuotaEliminada = await cuotaService.delete(req.params.id);
      return successResponse(
        res,
        cuotaEliminada,
        "Cuota eliminada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/cuotas/resumen/alumno/:id
   */
  getBalanceAlumno = async (req, res, next) => {
    try {
      const balance = await cuotaService.getBalanceAlumno(req.params.id);
      return successResponse(
        res,
        balance,
        "Balance financiero del alumno obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const cuotaController = new CuotaController();
export default cuotaController;

