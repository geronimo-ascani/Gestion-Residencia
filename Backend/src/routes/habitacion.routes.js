import { Router } from "express";
import { habitacionController } from "../controllers/habitacion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
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
 * @desc    Crear una nueva habitación (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
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
 * @desc    Actualizar datos de una habitación (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: habitacionIdParamSchema,
    body: updateHabitacionSchema,
  }),
  habitacionController.update
);

/**
 * @route   DELETE /api/habitaciones/:id
 * @desc    Eliminar una habitación (solo si no tiene ocupantes actuales, solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: habitacionIdParamSchema }),
  habitacionController.delete
);

/**
 * @route   POST /api/habitaciones/:id/asignar
 * @desc    Asignar un alumno a la habitación (solo administradores)
 */
router.post(
  "/:id/asignar",
  requireAdmin,
  validate({
    params: habitacionIdParamSchema,
    body: asignarAlumnoSchema,
  }),
  habitacionController.asignarAlumno
);

/**
 * @route   PUT /api/habitaciones/:id/desasignar
 * @desc    Desasignar / liberar a un alumno de la habitación (solo administradores)
 */
router.put(
  "/:id/desasignar",
  requireAdmin,
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
