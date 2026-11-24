import { Router } from "express";
import { pagoController } from "../controllers/pago.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireOwnershipOrAdmin, requireAdmin, requireEntityOwnershipOrAdmin } from "../middlewares/auth.middleware.js";
import {
  registrarCobroSchema,
  pagoIdParamSchema,
  queryPagoSchema,
} from "../schemas/pago.schema.js";

const router = Router();

/**
 * @route   POST /api/pagos (y /api/cobros)
 * @desc    Registrar un cobro completo o parcial vinculado a una factura (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: registrarCobroSchema }),
  pagoController.registrar
);

/**
 * @route   GET /api/pagos (y /api/cobros)
 * @desc    Obtener lista paginada de cobros con filtros y total recaudado
 */
router.get(
  "/",
  validate({ query: queryPagoSchema }),
  requireOwnershipOrAdmin(),
  pagoController.getAll
);

/**
 * @route   GET /api/pagos/:id
 * @desc    Obtener el detalle de un cobro por su ID (titular o administrador)
 */
router.get(
  "/:id",
  validate({ params: pagoIdParamSchema }),
  requireEntityOwnershipOrAdmin("pago"),
  pagoController.getById
);

export default router;
