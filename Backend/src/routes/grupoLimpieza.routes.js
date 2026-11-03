import { Router } from "express";
import { grupoLimpiezaController } from "../controllers/grupoLimpieza.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createGrupoSchema,
  updateGrupoSchema,
  grupoIdParamSchema,
  agregarAlumnoGrupoSchema,
  grupoAlumnoParamsSchema,
  asignarAmbienteGrupoSchema,
  finalizarAsignacionAmbienteSchema,
  grupoAmbienteParamsSchema,
  queryLimpiezaSchema,
} from "../schemas/limpieza.schema.js";

const router = Router();

/**
 * @route   POST /api/grupos-limpieza
 * @desc    Crear un nuevo grupo de limpieza
 */
router.post(
  "/",
  validate({ body: createGrupoSchema }),
  grupoLimpiezaController.create
);

/**
 * @route   GET /api/grupos-limpieza
 * @desc    Listar grupos de limpieza con miembros y asignaciones activas
 */
router.get(
  "/",
  validate({ query: queryLimpiezaSchema }),
  grupoLimpiezaController.getAll
);

/**
 * @route   GET /api/grupos-limpieza/cronograma
 * @desc    Cronograma consolidado de limpieza actual por ambientes
 */
router.get("/cronograma", grupoLimpiezaController.getCronograma);

/**
 * @route   GET /api/grupos-limpieza/:id
 * @desc    Obtener detalle de un grupo con historial de turnos
 */
router.get(
  "/:id",
  validate({ params: grupoIdParamSchema }),
  grupoLimpiezaController.getById
);

/**
 * @route   PUT /api/grupos-limpieza/:id
 * @desc    Actualizar nombre de un grupo de limpieza
 */
router.put(
  "/:id",
  validate({
    params: grupoIdParamSchema,
    body: updateGrupoSchema,
  }),
  grupoLimpiezaController.update
);

/**
 * @route   DELETE /api/grupos-limpieza/:id
 * @desc    Eliminar un grupo de limpieza
 */
router.delete(
  "/:id",
  validate({ params: grupoIdParamSchema }),
  grupoLimpiezaController.delete
);

/**
 * @route   POST /api/grupos-limpieza/:id/alumnos
 * @desc    Añadir un alumno al grupo de limpieza
 */
router.post(
  "/:id/alumnos",
  validate({
    params: grupoIdParamSchema,
    body: agregarAlumnoGrupoSchema,
  }),
  grupoLimpiezaController.agregarAlumno
);

/**
 * @route   DELETE /api/grupos-limpieza/:id/alumnos/:idAlumno
 * @desc    Quitar un alumno del grupo de limpieza
 */
router.delete(
  "/:id/alumnos/:idAlumno",
  validate({ params: grupoAlumnoParamsSchema }),
  grupoLimpiezaController.quitarAlumno
);

/**
 * @route   POST /api/grupos-limpieza/:id/ambientes
 * @desc    Asignar un ambiente al grupo (rango de fechas de turno)
 */
router.post(
  "/:id/ambientes",
  validate({
    params: grupoIdParamSchema,
    body: asignarAmbienteGrupoSchema,
  }),
  grupoLimpiezaController.asignarAmbiente
);

/**
 * @route   PUT /api/grupos-limpieza/:id/ambientes/:idAmbiente/finalizar
 * @desc    Finalizar turno de un ambiente para el grupo
 */
router.put(
  "/:id/ambientes/:idAmbiente/finalizar",
  validate({
    params: grupoAmbienteParamsSchema,
    body: finalizarAsignacionAmbienteSchema,
  }),
  grupoLimpiezaController.finalizarTurnoAmbiente
);

export default router;

