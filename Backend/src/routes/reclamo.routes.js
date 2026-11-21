import { Router } from "express";
import { reclamoController } from "../controllers/reclamo.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireOwnershipOrAdmin, requireAdmin, requireEntityOwnershipOrAdmin } from "../middlewares/auth.middleware.js";
import {
  createReclamoSchema,
  responderReclamoSchema,
  reclamoIdParamSchema,
  queryReclamoSchema,
} from "../schemas/reclamo.schema.js";

const router = Router();

/**
 * @route   POST /api/reclamos
 * @desc    Crear una nueva presentación (reclamo, solicitud o aviso de problema)
 */
router.post(
  "/",
  requireOwnershipOrAdmin((req) => req.body.idAlumno),
  validate({ body: createReclamoSchema }),
  reclamoController.create
);

/**
 * @route   GET /api/reclamos
 * @desc    Listar presentaciones con filtros por alumno, estado, categoría, prioridad y búsqueda
 */
router.get(
  "/",
  requireOwnershipOrAdmin(),
  validate({ query: queryReclamoSchema }),
  reclamoController.getAll
);

/**
 * @route   GET /api/reclamos/:id
 * @desc    Obtener el detalle de una presentación por ID con toda su bitácora de seguimiento (titular o administrador)
 */
router.get(
  "/:id",
  validate({ params: reclamoIdParamSchema }),
  requireEntityOwnershipOrAdmin("reclamo"),
  reclamoController.getById
);

/**
 * @route   POST /api/reclamos/:id/respuestas
 * @desc    Agregar un mensaje de seguimiento o actualizar el estado de la presentación (titular o administrador)
 */
router.post(
  "/:id/respuestas",
  validate({
    params: reclamoIdParamSchema,
    body: responderReclamoSchema,
  }),
  requireEntityOwnershipOrAdmin("reclamo"),
  reclamoController.responder
);

/**
 * @route   POST /api/reclamos/:id/responder
 * @desc    Alias para agregar respuesta o seguimiento (titular o administrador)
 */
router.post(
  "/:id/responder",
  validate({
    params: reclamoIdParamSchema,
    body: responderReclamoSchema,
  }),
  requireEntityOwnershipOrAdmin("reclamo"),
  reclamoController.responder
);

/**
 * @route   DELETE /api/reclamos/:id
 * @desc    Eliminar una presentación (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: reclamoIdParamSchema }),
  reclamoController.delete
);

export default router;
