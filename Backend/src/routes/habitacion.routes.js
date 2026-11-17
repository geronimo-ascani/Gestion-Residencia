import { Router } from "express";
import { habitacionController } from "../controllers/habitacion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createHabitacionSchema,
  updateHabitacionSchema,
  habitacionIdParamSchema,
  queryHabitacionSchema,
  asignarAlumnoSchema,
  desasignarAlumnoSchema,
} from "../schemas/habitacion.schema.js";

const router = Router();

/**
 * @route   POST /api/habitaciones
 * @desc    Crear una nueva habitación
 */
router.post(
  "/",
  validate({ body: createHabitacionSchema }),
  habitacionController.create
);

/**
 * @route   GET /api/habitaciones
 * @desc    Obtener lista de habitaciones con métricas de ocupación, filtros y paginación
 */
router.get(
  "/",
  validate({ query: queryHabitacionSchema }),
  habitacionController.getAll
);

/**
 * @route   GET /api/habitaciones/:id
 * @desc    Obtener detalle de habitación con ocupantes actuales e historial
 */
router.get(
  "/:id",
  validate({ params: habitacionIdParamSchema }),
  habitacionController.getById
);

/**
 * @route   PUT /api/habitaciones/:id
 * @desc    Actualizar datos de una habitación
 */
router.put(
  "/:id",
  validate({
    params: habitacionIdParamSchema,
    body: updateHabitacionSchema,
  }),
  habitacionController.update
);

/**
 * @route   DELETE /api/habitaciones/:id
 * @desc    Eliminar una habitación (solo si no tiene ocupantes actuales)
 */
router.delete(
  "/:id",
  validate({ params: habitacionIdParamSchema }),
  habitacionController.delete
);

/**
 * @route   POST /api/habitaciones/:id/asignar
 * @desc    Asignar un alumno a la habitación
 */
router.post(
  "/:id/asignar",
  validate({
    params: habitacionIdParamSchema,
    body: asignarAlumnoSchema,
  }),
  habitacionController.asignarAlumno
);

/**
 * @route   PUT /api/habitaciones/:id/desasignar
 * @desc    Desasignar / liberar a un alumno de la habitación
 */
router.put(
  "/:id/desasignar",
  validate({
    params: habitacionIdParamSchema,
    body: desasignarAlumnoSchema,
  }),
  habitacionController.desasignarAlumno
);

/**
 * @route   GET /api/habitaciones/:id/ocupantes
 * @desc    Obtener lista de ocupantes actuales de una habitación
 */
router.get(
  "/:id/ocupantes",
  validate({ params: habitacionIdParamSchema }),
  habitacionController.getOcupantes
);

export default router;
