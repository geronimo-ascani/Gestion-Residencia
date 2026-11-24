import { Router } from "express";
import { multaController } from "../controllers/multa.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireOwnershipOrAdmin, requireAdmin, requireEntityOwnershipOrAdmin } from "../middlewares/auth.middleware.js";
import {
  emitirMultaSchema,
  updateMultaSchema,
  prorrogarMultaSchema,
  anularMultaSchema,
  cambiarEstadoMultaSchema,
  multaIdParamSchema,
  queryMultaSchema,
} from "../schemas/multa.schema.js";

const router = Router();

/**
 * @route   POST /api/multas
 * @desc    Emitir una o varias multas disciplinarias (lote o individual) (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: emitirMultaSchema }),
  multaController.emitir
);

/**
 * @route   GET /api/multas
 * @desc    Obtener lista de multas con filtros, métricas financieras y estados enriquecidos
 */
router.get(
  "/",
  validate({ query: queryMultaSchema }),
  requireOwnershipOrAdmin(),
  multaController.getAll
);

/**
 * @route   GET /api/multas/:id
 * @desc    Obtener detalle de una multa por su ID con auditoría CambioMulta (titular o administrador)
 */
router.get(
  "/:id",
  validate({ params: multaIdParamSchema }),
  requireEntityOwnershipOrAdmin("multa"),
  multaController.getById
);

/**
 * @route   PUT /api/multas/:id
 * @desc    Actualizar datos de una multa y registrar automáticamente la auditoría de cambios (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: multaIdParamSchema,
    body: updateMultaSchema,
  }),
  multaController.update
);

/**
 * @route   POST /api/multas/:id/prorrogar
 * @desc    Prorrogar o aplazar la fecha de vencimiento de una multa registrando auditoría (solo administradores)
 */
router.post(
  "/:id/prorrogar",
  requireAdmin,
  validate({
    params: multaIdParamSchema,
    body: prorrogarMultaSchema,
  }),
  multaController.prorrogar
);

/**
 * @route   POST /api/multas/:id/anular
 * @desc    Anular una multa pendiente registrando el motivo en auditoría (solo administradores)
 */
router.post(
  "/:id/anular",
  requireAdmin,
  validate({
    params: multaIdParamSchema,
    body: anularMultaSchema,
  }),
  multaController.anular
);

/**
 * @route   PATCH /api/multas/:id/estado
 * @desc    Cambiar estado de una multa (compatibilidad) (solo administradores)
 */
router.patch(
  "/:id/estado",
  requireAdmin,
  validate({
    params: multaIdParamSchema,
    body: cambiarEstadoMultaSchema,
  }),
  multaController.cambiarEstado
);

/**
 * @route   POST /api/multas/:id/pagar
 * @desc    Registrar el cobro directo de una multa (solo administradores)
 */
router.post(
  "/:id/pagar",
  requireAdmin,
  validate({ params: multaIdParamSchema }),
  multaController.registrarPago
);

/**
 * @route   DELETE /api/multas/:id
 * @desc    Eliminar una multa por su ID (si no está facturada ni pagada, solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: multaIdParamSchema }),
  multaController.delete
);

export default router;
