import { Router } from "express";
import { facturaController } from "../controllers/factura.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireOwnershipOrAdmin, requireAdmin, requireEntityOwnershipOrAdmin } from "../middlewares/auth.middleware.js";
import {
  generarFacturaSchema,
  generarFacturasMesSchema,
  cancelarFacturaSchema,
  emitirReemplazoSchema,
  facturaIdParamSchema,
  queryFacturaSchema,
} from "../schemas/factura.schema.js";

const router = Router();

/**
 * @route   POST /api/facturas
 * @desc    Emite una factura individual para un contrato y período (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: generarFacturaSchema }),
  facturaController.generar
);

/**
 * @route   POST /api/facturas/generar-mes
 * @desc    Generación masiva de facturas para los contratos vigentes de un período (solo administradores)
 */
router.post(
  "/generar-mes",
  requireAdmin,
  validate({ body: generarFacturasMesSchema }),
  facturaController.generarMes
);

/**
 * @route   GET /api/facturas
 * @desc    Obtener lista de facturas con filtros, montos y estado dinámico
 */
router.get(
  "/",
  validate({ query: queryFacturaSchema }),
  requireOwnershipOrAdmin(),
  facturaController.getAll
);

/**
 * @route   GET /api/facturas/:id
 * @desc    Obtener el detalle de una factura con sus renglones y cobros (titular o administrador)
 */
router.get(
  "/:id",
  validate({ params: facturaIdParamSchema }),
  requireEntityOwnershipOrAdmin("factura"),
  facturaController.getById
);

/**
 * @route   POST /api/facturas/reemplazo
 * @desc    Emite una factura de reemplazo aplicando el crédito acumulado de una factura cancelada (solo administradores)
 */
router.post(
  "/reemplazo",
  requireAdmin,
  validate({ body: emitirReemplazoSchema }),
  facturaController.emitirReemplazo
);

/**
 * @route   POST /api/facturas/:id/cancelar
 * @desc    Cancela una factura existente (solo administradores)
 */
router.post(
  "/:id/cancelar",
  requireAdmin,
  validate({ params: facturaIdParamSchema, body: cancelarFacturaSchema }),
  facturaController.cancelar
);

/**
 * @route   DELETE /api/facturas/:id
 * @desc    Eliminar una factura sin cobros asociados (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: facturaIdParamSchema }),
  facturaController.delete
);

export default router;
