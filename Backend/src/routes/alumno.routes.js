import { Router } from "express";
import { alumnoController } from "../controllers/alumno.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAlumnoSchema,
  updateAlumnoSchema,
  alumnoIdParamSchema,
  queryAlumnoSchema,
  contactoEmergenciaSchema,
  contactoEmergenciaParamSchema,
} from "../schemas/alumno.schema.js";

const router = Router();

/**
 * @route   POST /api/alumnos
 * @desc    Crear un nuevo alumno con perfil extendido
 */
router.post(
  "/",
  validate({ body: createAlumnoSchema }),
  alumnoController.create
);

/**
 * @route   GET /api/alumnos
 * @desc    Obtener lista de alumnos con paginación, filtros y búsqueda
 */
router.get(
  "/",
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
  alumnoController.getById
);

/**
 * @route   PUT /api/alumnos/:id
 * @desc    Actualizar un alumno o una sección de su perfil
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

/**
 * @route   POST /api/alumnos/:id/contactos-emergencia
 * @desc    Agregar un contacto de emergencia a un alumno
 */
router.post(
  "/:id/contactos-emergencia",
  validate({
    params: alumnoIdParamSchema,
    body: contactoEmergenciaSchema,
  }),
  alumnoController.addContacto
);

/**
 * @route   PUT /api/alumnos/:id/contactos-emergencia/:idContacto
 * @desc    Actualizar un contacto de emergencia existente
 */
router.put(
  "/:id/contactos-emergencia/:idContacto",
  validate({
    params: contactoEmergenciaParamSchema,
    body: contactoEmergenciaSchema.partial(),
  }),
  alumnoController.updateContacto
);

/**
 * @route   DELETE /api/alumnos/:id/contactos-emergencia/:idContacto
 * @desc    Eliminar un contacto de emergencia
 */
router.delete(
  "/:id/contactos-emergencia/:idContacto",
  validate({ params: contactoEmergenciaParamSchema }),
  alumnoController.deleteContacto
);

export default router;
