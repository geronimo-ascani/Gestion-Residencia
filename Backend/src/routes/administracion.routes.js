import { Router } from "express";
import { administracionController } from "../controllers/administracion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { z } from "zod";
import { idCoerce } from "../schemas/idHelper.js";
import {
  updateParametrosSchema,
  crearCambioAdministrativoSchema,
  queryCambioAdministrativoSchema,
  crearNotificacionSchema,
  notificacionIdParamSchema,
  queryNotificacionesSchema,
  crearAdministradorSchema,
  updateAdministradorSchema,
  cambiarEstadoCuentaSchema,
  opcionCatalogoSchema,
} from "../schemas/administracion.schema.js";

const router = Router();
const validarId = validate({ params: z.object({ id: idCoerce }) });

/**
 * ==========================================
 * PARÁMETROS DEL SISTEMA
 * ==========================================
 */
router.get("/parametros", requireAdmin, administracionController.getParametros);
router.put(
  "/parametros",
  requireAdmin,
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
  requireAdmin,
  validate({ query: queryCambioAdministrativoSchema }),
  administracionController.getAllCambios
);
router.get(
  "/auditoria",
  requireAdmin,
  validate({ query: queryCambioAdministrativoSchema }),
  administracionController.getAllCambios
);
router.post(
  "/historial",
  requireAdmin,
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
  requireAdmin,
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

/**
 * ==========================================
 * GESTIÓN DE ADMINISTRADORES Y CUENTAS
 * ==========================================
 */
router.get("/administradores", requireAdmin, administracionController.getAdministradores);
router.get("/administradores/:id", requireAdmin, validarId, administracionController.getAdministradorById);
router.post(
  "/administradores",
  requireAdmin,
  validate({ body: crearAdministradorSchema }),
  administracionController.crearAdministrador
);
router.put(
  "/administradores/:id",
  requireAdmin,
  validarId,
  validate({ body: updateAdministradorSchema }),
  administracionController.updateAdministrador
);
router.patch(
  "/usuarios/:id/estado",
  requireAdmin,
  validarId,
  validate({ body: cambiarEstadoCuentaSchema }),
  administracionController.cambiarEstadoCuenta
);

/**
 * ==========================================
 * CATÁLOGOS DINÁMICOS (CARRERAS Y VÍNCULOS)
 * ==========================================
 */
router.get("/catalogos/:tipo", requireAdmin, administracionController.getCatalogo);
router.post(
  "/catalogos/:tipo",
  requireAdmin,
  validate({ body: opcionCatalogoSchema }),
  administracionController.crearOpcionCatalogo
);
router.put(
  "/catalogos/:tipo/:id",
  requireAdmin,
  validate({ body: opcionCatalogoSchema.partial() }),
  administracionController.updateOpcionCatalogo
);

/**
 * ==========================================
 * MÉTRICAS DEL DASHBOARD
 * ==========================================
 */
router.get("/dashboard/resumen", requireAdmin, administracionController.getDashboardResumen);

/**
 * ==========================================
 * ESTADO COMPLETO DEL SISTEMA
 * ==========================================
 */
router.get("/estado", administracionController.getEstadoCompleto);
router.get("/bootstrap", administracionController.getEstadoCompleto);

export default router;
