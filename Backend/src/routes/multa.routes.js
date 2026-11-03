import { Router } from "express";
import { multaController } from "../controllers/multa.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createMultaSchema,
  updateMultaSchema,
  cambiarEstadoMultaSchema,
  multaIdParamSchema,
  queryMultaSchema,
} from "../schemas/multa.schema.js";

const router = Router();

/**
 * @route   POST /api/multas
 * @desc    Registrar una nueva multa
 */
router.post(
  "/",
  validate({ body: createMultaSchema }),
  multaController.create
);

/**
 * @route   GET /api/multas
 * @desc    Obtener lista de multas con filtros y métricas financieras
 */
router.get(
  "/",
  validate({ query: queryMultaSchema }),
  multaController.getAll
);

/**
 * @route   GET /api/multas/:id
 * @desc    Obtener detalle de una multa por su ID
 */
router.get(
  "/:id",
  validate({ params: multaIdParamSchema }),
  multaController.getById
);

/**
 * @route   PUT /api/multas/:id
 * @desc    Actualizar monto o fecha de vencimiento de una multa
 */
router.put(
  "/:id",
  validate({
    params: multaIdParamSchema,
    body: updateMultaSchema,
  }),
  multaController.update
);

/**
 * @route   PATCH /api/multas/:id/estado
 * @desc    Cambiar estado de una multa (PENDIENTE, PAGADA, ANULADA)
 */
router.patch(
  "/:id/estado",
  validate({
    params: multaIdParamSchema,
    body: cambiarEstadoMultaSchema,
  }),
  multaController.cambiarEstado
);

/**
 * @route   POST /api/multas/:id/pagar
 * @desc    Registrar el pago de una multa
 */
router.post(
  "/:id/pagar",
  validate({ params: multaIdParamSchema }),
  multaController.registrarPago
);

/**
 * @route   DELETE /api/multas/:id
 * @desc    Eliminar una multa por su ID
 */
router.delete(
  "/:id",
  validate({ params: multaIdParamSchema }),
  multaController.delete
);

export default router;

