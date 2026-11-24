import { Router } from "express";
import { grupoLimpiezaController } from "../controllers/grupoLimpieza.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
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
 * @desc    Crear una nueva tarea de limpieza (solo administradores)
 */
router.post(
  "/tareas",
  requireAdmin,
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
 * @desc    Modificar una tarea de limpieza (solo administradores)
 */
router.put(
  "/tareas/:numero",
  requireAdmin,
  validate({
    params: tareaNumeroParamSchema,
    body: updateTareaLimpiezaSchema,
  }),
  grupoLimpiezaController.updateTarea
);

/**
 * @route   DELETE /api/grupos-limpieza/tareas/:numero
 * @desc    Eliminar una tarea de limpieza (solo administradores)
 */
router.delete(
  "/tareas/:numero",
  requireAdmin,
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
 * @desc    Crear un nuevo grupo de limpieza (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
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
 * @desc    Actualizar nombre o tarea inicial del grupo (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: grupoIdParamSchema,
    body: updateGrupoSchema,
  }),
  grupoLimpiezaController.update
);

/**
 * @route   DELETE /api/grupos-limpieza/:id
 * @desc    Eliminar grupo de limpieza (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
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
 * @route   PUT /api/grupos-limpieza/:id/integrantes
 * @desc    Reemplazar integrantes del grupo (solo administradores)
 */
router.put(
  "/:id/alumnos",
  requireAdmin,
  validate({
    params: grupoIdParamSchema,
    body: guardarIntegrantesSchema,
  }),
  grupoLimpiezaController.guardarIntegrantes
);

router.put(
  "/:id/integrantes",
  requireAdmin,
  validate({
    params: grupoIdParamSchema,
    body: guardarIntegrantesSchema,
  }),
  grupoLimpiezaController.guardarIntegrantes
);

/**
 * @route   POST /api/grupos-limpieza/:id/integrantes
 * @desc    Alias para reemplazo de integrantes (solo administradores)
 */
router.post(
  "/:id/integrantes",
  requireAdmin,
  validate({
    params: grupoIdParamSchema,
    body: guardarIntegrantesSchema,
  }),
  grupoLimpiezaController.guardarIntegrantes
);

/**
 * @route   POST /api/grupos-limpieza/:id/alumnos
 * @desc    Añadir o trasladar un alumno a un grupo de limpieza (solo administradores)
 */
router.post(
  "/:id/alumnos",
  requireAdmin,
  validate({
    params: grupoIdParamSchema,
    body: agregarAlumnoGrupoSchema,
  }),
  grupoLimpiezaController.agregarAlumno
);

/**
 * @route   DELETE /api/grupos-limpieza/:id/alumnos/:idAlumno
 * @desc    Quitar un alumno del grupo de limpieza (solo administradores)
 */
router.delete(
  "/:id/alumnos/:idAlumno",
  requireAdmin,
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
 * @desc    Asignar un ambiente común al grupo de limpieza (solo administradores)
 */
router.post(
  "/:id/ambientes",
  requireAdmin,
  validate({
    params: grupoIdParamSchema,
    body: asignarAmbienteGrupoSchema,
  }),
  grupoLimpiezaController.asignarAmbiente
);

/**
 * @route   PUT /api/grupos-limpieza/:id/ambientes/:idAmbiente/finalizar
 * @desc    Finalizar turno de aseo de un ambiente para el grupo (solo administradores)
 */
router.put(
  "/:id/ambientes/:idAmbiente/finalizar",
  requireAdmin,
  validate({
    params: grupoAmbienteParamsSchema,
    body: finalizarAsignacionAmbienteSchema,
  }),
  grupoLimpiezaController.finalizarTurnoAmbiente
);

export default router;
