import { Router } from "express";
import { ambienteController } from "../controllers/ambiente.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAmbienteSchema,
  updateAmbienteSchema,
  ambienteIdParamSchema,
  queryLimpiezaSchema,
} from "../schemas/limpieza.schema.js";

const router = Router();

/**
 * @route   POST /api/ambientes
 * @desc    Registrar un nuevo ambiente
 */
router.post(
  "/",
  validate({ body: createAmbienteSchema }),
  ambienteController.create
);

/**
 * @route   GET /api/ambientes
 * @desc    Listar todos los ambientes con el grupo que lo tiene asignado
 */
router.get(
  "/",
  validate({ query: queryLimpiezaSchema }),
  ambienteController.getAll
);

/**
 * @route   GET /api/ambientes/:id
 * @desc    Obtener detalle de un ambiente con historial de grupos asignados
 */
router.get(
  "/:id",
  validate({ params: ambienteIdParamSchema }),
  ambienteController.getById
);

/**
 * @route   PUT /api/ambientes/:id
 * @desc    Actualizar datos o tareas de un ambiente
 */
router.put(
  "/:id",
  validate({
    params: ambienteIdParamSchema,
    body: updateAmbienteSchema,
  }),
  ambienteController.update
);

/**
 * @route   DELETE /api/ambientes/:id
 * @desc    Eliminar un ambiente
 */
router.delete(
  "/:id",
  validate({ params: ambienteIdParamSchema }),
  ambienteController.delete
);

export default router;

