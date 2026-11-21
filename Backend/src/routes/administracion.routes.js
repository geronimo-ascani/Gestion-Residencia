import { Router } from "express";
import { administracionController } from "../controllers/administracion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { optionalAuthenticate, requireAdmin } from "../middlewares/auth.middleware.js";
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

/**
 * ==========================================
 * PARÁMETROS DEL SISTEMA
 * ==========================================
 */
router.get("/parametros", administracionController.getParametros);
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
  optionalAuthenticate,
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
  optionalAuthenticate,
  validate({ params: notificacionIdParamSchema }),
  administracionController.marcarLeida
);
router.post(
  "/notificaciones/marcar-todas-leidas",
  optionalAuthenticate,
  administracionController.marcarTodasLeidas
);

/**
 * ==========================================
 * GESTIÓN DE ADMINISTRADORES Y CUENTAS
 * ==========================================
 */
router.get("/administradores", requireAdmin, administracionController.getAdministradores);
router.get("/administradores/:id", requireAdmin, administracionController.getAdministradorById);
router.post(
  "/administradores",
  requireAdmin,
  validate({ body: crearAdministradorSchema }),
  administracionController.crearAdministrador
);
router.put(
  "/administradores/:id",
  requireAdmin,
  validate({ body: updateAdministradorSchema }),
  administracionController.updateAdministrador
);
router.patch(
  "/usuarios/:id/estado",
  requireAdmin,
  validate({ body: cambiarEstadoCuentaSchema }),
  administracionController.cambiarEstadoCuenta
);

/**
 * ==========================================
 * CATÁLOGOS DINÁMICOS (CARRERAS Y VÍNCULOS)
 * ==========================================
 */
router.get("/catalogos/:tipo", administracionController.getCatalogo);
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
