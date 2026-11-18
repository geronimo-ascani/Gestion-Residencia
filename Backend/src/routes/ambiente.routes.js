import { Router } from "express";
import { ambienteController } from "../controllers/ambiente.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAmbienteSchema,
  updateAmbienteSchema,
  ambienteIdParamSchema,
  agregarEquipamientoSchema,
  equipamientoIdParamSchema,
  queryAmbienteSchema,
} from "../schemas/limpieza.schema.js";

const router = Router();

/**
 * @route   POST /api/ambientes
 * @desc    Crear un nuevo ambiente común con inventario opcional
 */
router.post(
  "/",
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
 * @desc    Actualizar metadatos de un ambiente (nombre, tipo, tareas, descripción)
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
 * @desc    Eliminar un ambiente y su equipamiento
 */
router.delete(
  "/:id",
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
 * @desc    Agregar equipamiento al ambiente (si ya existe, acumula la cantidad)
 */
router.post(
  "/:id/equipamiento",
  validate({
    params: ambienteIdParamSchema,
    body: agregarEquipamientoSchema,
  }),
  ambienteController.agregarEquipamiento
);

/**
 * @route   PUT /api/ambientes/:id/equipamiento/:idEquipamiento
 * @desc    Modificar un objeto de equipamiento en el ambiente
 */
router.put(
  "/:id/equipamiento/:idEquipamiento",
  validate({ params: equipamientoIdParamSchema }),
  ambienteController.updateEquipamiento
);

/**
 * @route   DELETE /api/ambientes/:id/equipamiento/:idEquipamiento
 * @desc    Eliminar un objeto de equipamiento del ambiente
 */
router.delete(
  "/:id/equipamiento/:idEquipamiento",
  validate({ params: equipamientoIdParamSchema }),
  ambienteController.deleteEquipamiento
);

export default router;
