import { Router } from "express";
import { contratoController } from "../controllers/contrato.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
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
 * @desc    Crear un nuevo contrato
 */
router.post(
  "/",
  validate({ body: createContratoSchema }),
  contratoController.create
);

/**
 * @route   GET /api/contratos
 * @desc    Obtener lista de contratos con filtros y paginación
 */
router.get(
  "/",
  validate({ query: queryContratoSchema }),
  contratoController.getAll
);

/**
 * @route   GET /api/contratos/:id
 * @desc    Obtener un contrato por su ID
 */
router.get(
  "/:id",
  validate({ params: contratoIdParamSchema }),
  contratoController.getById
);

/**
 * @route   PUT /api/contratos/:id
 * @desc    Actualizar datos o fechas de un contrato
 */
router.put(
  "/:id",
  validate({
    params: contratoIdParamSchema,
    body: updateContratoSchema,
  }),
  contratoController.update
);

/**
 * @route   PATCH /api/contratos/:id/estado
 * @desc    Actualizar el estado del contrato (VIGENTE, FINALIZADO, RESCINDIDO, CANCELADO)
 */
router.patch(
  "/:id/estado",
  validate({
    params: contratoIdParamSchema,
    body: cambiarEstadoContratoSchema,
  }),
  contratoController.cambiarEstado
);

/**
 * @route   DELETE /api/contratos/:id
 * @desc    Eliminar un contrato por su ID
 */
router.delete(
  "/:id",
  validate({ params: contratoIdParamSchema }),
  contratoController.delete
);

export default router;
