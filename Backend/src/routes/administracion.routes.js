import { Router } from "express";
import { administracionController } from "../controllers/administracion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updateParametrosSchema,
  crearCambioAdministrativoSchema,
  queryCambioAdministrativoSchema,
  crearNotificacionSchema,
  notificacionIdParamSchema,
  queryNotificacionesSchema,
} from "../schemas/administracion.schema.js";

const router = Router();

/**
 * ==========================================
 * PARÁMETROS DEL SISTEMA
 * ==========================================
 */
router.get("/parametros", administracionController.getParametros);
router.put(
  "/parametros",
  validate({ body: updateParametrosSchema }),
  administracionController.updateParametros
);

/**
 * ==========================================
 * HISTORIAL Y AUDITORÍA ADMINISTRATIVA
 * ==========================================
 */
router.get(
  "/historial",
  validate({ query: queryCambioAdministrativoSchema }),
  administracionController.getAllCambios
);
router.get(
  "/auditoria",
  validate({ query: queryCambioAdministrativoSchema }),
  administracionController.getAllCambios
);
router.post(
  "/historial",
  validate({ body: crearCambioAdministrativoSchema }),
  administracionController.registrarCambio
);

/**
 * ==========================================
 * NOTIFICACIONES INTERNAS
 * ==========================================
 */
router.get(
  "/notificaciones",
  validate({ query: queryNotificacionesSchema }),
  administracionController.getNotificaciones
);
router.post(
  "/notificaciones",
  validate({ body: crearNotificacionSchema }),
  administracionController.crearNotificacion
);
router.patch(
  "/notificaciones/:id/leida",
  validate({ params: notificacionIdParamSchema }),
  administracionController.marcarLeida
);
router.post(
  "/notificaciones/marcar-todas-leidas",
  administracionController.marcarTodasLeidas
);

export default router;
