import { Router } from "express";
import { ambienteController } from "../controllers/ambiente.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import {
  createAmbienteSchema,
  updateAmbienteSchema,
  ambienteIdParamSchema,
  agregarEquipamientoSchema,
  actualizarEquipamientoPorNombreSchema,
  eliminarEquipamientoPorNombreSchema,
  updateEquipamientoSchema,
  equipamientoIdParamSchema,
  queryAmbienteSchema,
} from "../schemas/limpieza.schema.js";

const router = Router();

/**
 * @route   POST /api/ambientes
 * @desc    Crear un nuevo ambiente común con inventario opcional (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: createAmbienteSchema }),
  ambienteController.create
);

/**
 * @route   GET /api/ambientes
 * @desc    Listar ambientes comunes con filtro por tipo, búsqueda e inventario
 */
router.get(
  "/",
  validate({ query: queryAmbienteSchema }),
  ambienteController.getAll
);

/**
 * @route   GET /api/ambientes/:id
 * @desc    Obtener detalle de un ambiente por su ID con equipamiento e historial
 */
router.get(
  "/:id",
  validate({ params: ambienteIdParamSchema }),
  ambienteController.getById
);

/**
 * @route   PUT /api/ambientes/:id
 * @desc    Actualizar metadatos de un ambiente (nombre, tipo, tareas, descripción) (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: ambienteIdParamSchema,
    body: updateAmbienteSchema,
  }),
  ambienteController.update
);

/**
 * @route   DELETE /api/ambientes/:id
 * @desc    Eliminar un ambiente y su equipamiento (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: ambienteIdParamSchema }),
  ambienteController.delete
);

/**
 * ==========================================
 * RUTAS DE EQUIPAMIENTO DEL AMBIENTE
 * ==========================================
 */

/**
 * @route   POST /api/ambientes/:id/equipamiento
 * @desc    Agregar equipamiento al ambiente (si ya existe, acumula la cantidad) (solo administradores)
 */
router.post(
  "/:id/equipamiento",
  requireAdmin,
  validate({
    params: ambienteIdParamSchema,
    body: agregarEquipamientoSchema,
  }),
  ambienteController.agregarEquipamiento
);

/**
 * @route   PUT /api/ambientes/:id/equipamiento
 * @desc    Actualizar equipamiento por nombre anterior (solo administradores)
 */
router.put(
  "/:id/equipamiento",
  requireAdmin,
  validate({
    params: ambienteIdParamSchema,
    body: actualizarEquipamientoPorNombreSchema,
  }),
  ambienteController.actualizarEquipamientoPorNombre
);

/**
 * @route   DELETE /api/ambientes/:id/equipamiento
 * @desc    Eliminar equipamiento por nombre (solo administradores)
 */
router.delete(
  "/:id/equipamiento",
  requireAdmin,
  validate({
    params: ambienteIdParamSchema,
    body: eliminarEquipamientoPorNombreSchema,
  }),
  ambienteController.deleteEquipamientoPorNombre
);

/**
 * @route   PUT /api/ambientes/:id/equipamiento/:idEquipamiento
 * @desc    Modificar un objeto de equipamiento en el ambiente (solo administradores)
 */
router.put(
  "/:id/equipamiento/:idEquipamiento",
  requireAdmin,
  validate({
    params: equipamientoIdParamSchema,
    body: updateEquipamientoSchema,
  }),
  ambienteController.updateEquipamiento
);

/**
 * @route   DELETE /api/ambientes/:id/equipamiento/:idEquipamiento
 * @desc    Eliminar un objeto de equipamiento del ambiente (solo administradores)
 */
router.delete(
  "/:id/equipamiento/:idEquipamiento",
  requireAdmin,
  validate({ params: equipamientoIdParamSchema }),
  ambienteController.deleteEquipamiento
);

export default router;
