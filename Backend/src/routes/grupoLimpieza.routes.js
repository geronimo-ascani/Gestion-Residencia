import { Router } from "express";
import { grupoLimpiezaController } from "../controllers/grupoLimpieza.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createGrupoSchema,
  updateGrupoSchema,
  grupoIdParamSchema,
  guardarIntegrantesSchema,
  agregarAlumnoGrupoSchema,
  grupoAlumnoParamsSchema,
  asignarAmbienteGrupoSchema,
  finalizarAsignacionAmbienteSchema,
  grupoAmbienteParamsSchema,
  createTareaLimpiezaSchema,
  updateTareaLimpiezaSchema,
  tareaNumeroParamSchema,
  queryLimpiezaSchema,
} from "../schemas/limpieza.schema.js";

const router = Router();

/**
 * ==========================================
 * RUTAS DE CRONOGRAMA Y TAREAS DE LIMPIEZA
 * ==========================================
 */

/**
 * @route   GET /api/grupos-limpieza/cronograma
 * @desc    Obtener cronograma consolidado con rotación automática de tareas
 */
router.get("/cronograma", grupoLimpiezaController.getCronograma);

/**
 * @route   GET /api/grupos-limpieza/tareas
 * @desc    Listar tareas de limpieza estándar y adicionales
 */
router.get("/tareas", grupoLimpiezaController.getAllTareas);

/**
 * @route   POST /api/grupos-limpieza/tareas
 * @desc    Crear una nueva tarea de limpieza
 */
router.post(
  "/tareas",
  validate({ body: createTareaLimpiezaSchema }),
  grupoLimpiezaController.createTarea
);

/**
 * @route   GET /api/grupos-limpieza/tareas/:numero
 * @desc    Obtener una tarea de limpieza por su número
 */
router.get(
  "/tareas/:numero",
  validate({ params: tareaNumeroParamSchema }),
  grupoLimpiezaController.getTareaByNumero
);

/**
 * @route   PUT /api/grupos-limpieza/tareas/:numero
 * @desc    Modificar una tarea de limpieza (nombre, estado de rotación o actividades)
 */
router.put(
  "/tareas/:numero",
  validate({
    params: tareaNumeroParamSchema,
    body: updateTareaLimpiezaSchema,
  }),
  grupoLimpiezaController.updateTarea
);

/**
 * @route   DELETE /api/grupos-limpieza/tareas/:numero
 * @desc    Eliminar una tarea de limpieza
 */
router.delete(
  "/tareas/:numero",
  validate({ params: tareaNumeroParamSchema }),
  grupoLimpiezaController.deleteTarea
);

/**
 * ==========================================
 * RUTAS DE GRUPOS DE LIMPIEZA
 * ==========================================
 */

/**
 * @route   POST /api/grupos-limpieza
 * @desc    Crear un nuevo grupo de limpieza (máximo 4, tarea inicial 1-4 única)
 */
router.post(
  "/",
  validate({ body: createGrupoSchema }),
  grupoLimpiezaController.create
);

/**
 * @route   GET /api/grupos-limpieza
 * @desc    Obtener lista de grupos de limpieza con integrantes y tareas asignadas
 */
router.get(
  "/",
  validate({ query: queryLimpiezaSchema }),
  grupoLimpiezaController.getAll
);

/**
 * @route   GET /api/grupos-limpieza/:id
 * @desc    Obtener detalle del grupo de limpieza por ID
 */
router.get(
  "/:id",
  validate({ params: grupoIdParamSchema }),
  grupoLimpiezaController.getById
);

/**
 * @route   PUT /api/grupos-limpieza/:id
 * @desc    Actualizar nombre o tarea inicial del grupo
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
 * @desc    Eliminar grupo de limpieza
 */
router.delete(
  "/:id",
  validate({ params: grupoIdParamSchema }),
  grupoLimpiezaController.delete
);

/**
 * ==========================================
 * RUTAS DE GESTIÓN DE INTEGRANTES
 * ==========================================
 */

/**
 * @route   PUT /api/grupos-limpieza/:id/alumnos
 * @desc    Reemplazar de forma atómica la nómina completa de integrantes del grupo (con traslado automático)
 */
router.put(
  "/:id/alumnos",
  validate({
    params: grupoIdParamSchema,
    body: guardarIntegrantesSchema,
  }),
  grupoLimpiezaController.guardarIntegrantes
);

/**
 * @route   POST /api/grupos-limpieza/:id/integrantes
 * @desc    Alias para reemplazo de integrantes
 */
router.post(
  "/:id/integrantes",
  validate({
    params: grupoIdParamSchema,
    body: guardarIntegrantesSchema,
  }),
  grupoLimpiezaController.guardarIntegrantes
);

/**
 * @route   POST /api/grupos-limpieza/:id/alumnos
 * @desc    Añadir o trasladar un alumno a un grupo de limpieza
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
 * ==========================================
 * RUTAS DE AMBIENTES ASIGNADOS AL GRUPO
 * ==========================================
 */

/**
 * @route   POST /api/grupos-limpieza/:id/ambientes
 * @desc    Asignar un ambiente común al grupo de limpieza
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
 * @desc    Finalizar turno de aseo de un ambiente para el grupo
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
