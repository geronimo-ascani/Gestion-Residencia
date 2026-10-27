import { Router } from "express";
import { alumnoController } from "../controllers/alumno.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAlumnoSchema,
  updateAlumnoSchema,
  alumnoIdParamSchema,
  queryAlumnoSchema,
} from "../schemas/alumno.schema.js";

const router = Router();

/**
 * @route   POST /api/alumnos
 * @desc    Crear un nuevo alumno
 */
router.post(
  "/",
  validate({ body: createAlumnoSchema }),
  alumnoController.create
);

/**
 * @route   GET /api/alumnos
 * @desc    Obtener lista de alumnos con paginación y búsqueda
 */
router.get(
  "/",
  validate({ query: queryAlumnoSchema }),
  alumnoController.getAll
);

/**
 * @route   GET /api/alumnos/:id
 * @desc    Obtener un alumno por su ID
 */
router.get(
  "/:id",
  validate({ params: alumnoIdParamSchema }),
  alumnoController.getById
);

/**
 * @route   PUT /api/alumnos/:id
 * @desc    Actualizar un alumno por su ID
 */
router.put(
  "/:id",
  validate({ params: alumnoIdParamSchema, body: updateAlumnoSchema }),
  alumnoController.update
);

/**
 * @route   DELETE /api/alumnos/:id
 * @desc    Eliminar un alumno por su ID
 */
router.delete(
  "/:id",
  validate({ params: alumnoIdParamSchema }),
  alumnoController.delete
);

export default router;
