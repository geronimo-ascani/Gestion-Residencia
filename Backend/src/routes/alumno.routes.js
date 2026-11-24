import { Router } from "express";
import { alumnoController } from "../controllers/alumno.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireOwnershipOrAdmin, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  createAlumnoSchema,
  updateAlumnoSchema,
  alumnoIdParamSchema,
  queryAlumnoSchema,
  contactoEmergenciaSchema,
  contactoEmergenciaParamSchema,
  crearAccesoAlumnoSchema,
} from "../schemas/alumno.schema.js";

const router = Router();

/**
 * @route   POST /api/alumnos
 * @desc    Crear un nuevo alumno con perfil extendido (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: createAlumnoSchema }),
  alumnoController.create
);

/**
 * @route   GET /api/alumnos
 * @desc    Obtener lista de alumnos con paginación, filtros y búsqueda
 */
router.get(
  "/",
  requireOwnershipOrAdmin(),
  validate({ query: queryAlumnoSchema }),
  alumnoController.getAll
);

/**
 * @route   GET /api/alumnos/:id
 * @desc    Obtener la ficha integral de un alumno por su ID
 */
router.get(
  "/:id",
  validate({ params: alumnoIdParamSchema }),
  requireOwnershipOrAdmin(),
  alumnoController.getById
);

/**
 * @route   PUT /api/alumnos/:id
 * @desc    Actualizar un alumno o una sección de su perfil (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({ params: alumnoIdParamSchema, body: updateAlumnoSchema }),
  alumnoController.update
);

/**
 * @route   DELETE /api/alumnos/:id
 * @desc    Eliminar un alumno por su ID (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: alumnoIdParamSchema }),
  alumnoController.delete
);

/**
 * @route   POST /api/alumnos/:id/acceso
 * @desc    Crear o actualizar la cuenta de acceso y contraseña inicial del alumno (solo administradores)
 */
router.post(
  "/:id/acceso",
  requireAdmin,
  validate({ params: alumnoIdParamSchema, body: crearAccesoAlumnoSchema }),
  alumnoController.crearAcceso
);

/**
 * @route   POST /api/alumnos/:id/contactos-emergencia
 * @desc    Agregar un contacto de emergencia a un alumno (solo administradores)
 */
router.post(
  "/:id/contactos-emergencia",
  requireAdmin,
  validate({
    params: alumnoIdParamSchema,
    body: contactoEmergenciaSchema,
  }),
  alumnoController.addContacto
);

/**
 * @route   PUT /api/alumnos/:id/contactos-emergencia/:idContacto
 * @desc    Actualizar un contacto de emergencia existente (solo administradores)
 */
router.put(
  "/:id/contactos-emergencia/:idContacto",
  requireAdmin,
  validate({
    params: contactoEmergenciaParamSchema,
    body: contactoEmergenciaSchema.partial(),
  }),
  alumnoController.updateContacto
);

/**
 * @route   DELETE /api/alumnos/:id/contactos-emergencia/:idContacto
 * @desc    Eliminar un contacto de emergencia (solo administradores)
 */
router.delete(
  "/:id/contactos-emergencia/:idContacto",
  requireAdmin,
  validate({ params: contactoEmergenciaParamSchema }),
  alumnoController.deleteContacto
);

export default router;
