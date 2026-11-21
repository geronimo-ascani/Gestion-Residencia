import { Router } from "express";
import { contratoController } from "../controllers/contrato.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireOwnershipOrAdmin, requireAdmin, requireEntityOwnershipOrAdmin } from "../middlewares/auth.middleware.js";
import {
  createContratoSchema,
  updateContratoSchema,
  cambiarEstadoContratoSchema,
  contratoIdParamSchema,
  queryContratoSchema,
} from "../schemas/contrato.schema.js";

const router = Router();

/**
 * @route   POST /api/contratos
 * @desc    Crear un nuevo contrato (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: createContratoSchema }),
  contratoController.create
);

/**
 * @route   GET /api/contratos
 * @desc    Obtener lista de contratos con filtros y paginación
 */
router.get(
  "/",
  requireOwnershipOrAdmin(),
  validate({ query: queryContratoSchema }),
  contratoController.getAll
);

/**
 * @route   GET /api/contratos/:id
 * @desc    Obtener un contrato por su ID (titular o administrador)
 */
router.get(
  "/:id",
  validate({ params: contratoIdParamSchema }),
  requireEntityOwnershipOrAdmin("contrato"),
  contratoController.getById
);

/**
 * @route   PUT /api/contratos/:id
 * @desc    Actualizar datos o fechas de un contrato (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: contratoIdParamSchema,
    body: updateContratoSchema,
  }),
  contratoController.update
);

/**
 * @route   PATCH /api/contratos/:id/estado
 * @desc    Actualizar el estado del contrato (VIGENTE, FINALIZADO, RESCINDIDO, CANCELADO) (solo administradores)
 */
router.patch(
  "/:id/estado",
  requireAdmin,
  validate({
    params: contratoIdParamSchema,
    body: cambiarEstadoContratoSchema,
  }),
  contratoController.cambiarEstado
);

/**
 * @route   DELETE /api/contratos/:id
 * @desc    Eliminar un contrato por su ID (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: contratoIdParamSchema }),
  contratoController.delete
);

export default router;
