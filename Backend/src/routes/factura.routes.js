import { Router } from "express";
import { facturaController } from "../controllers/factura.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  generarFacturaSchema,
  generarFacturasMesSchema,
  facturaIdParamSchema,
  queryFacturaSchema,
} from "../schemas/factura.schema.js";

const router = Router();

/**
 * @route   POST /api/facturas
 * @desc    Emite una factura individual para un contrato y período
 */
router.post(
  "/",
  validate({ body: generarFacturaSchema }),
  facturaController.generar
);

/**
 * @route   POST /api/facturas/generar-mes
 * @desc    Generación masiva de facturas para los contratos vigentes de un período
 */
router.post(
  "/generar-mes",
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
  facturaController.getAll
);

/**
 * @route   GET /api/facturas/:id
 * @desc    Obtener el detalle de una factura con sus renglones y cobros
 */
router.get(
  "/:id",
  validate({ params: facturaIdParamSchema }),
  facturaController.getById
);

/**
 * @route   DELETE /api/facturas/:id
 * @desc    Eliminar una factura sin cobros asociados
 */
router.delete(
  "/:id",
  validate({ params: facturaIdParamSchema }),
  facturaController.delete
);

export default router;
