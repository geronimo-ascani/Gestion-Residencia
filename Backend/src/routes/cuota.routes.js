import { Router } from "express";
import { cuotaController } from "../controllers/cuota.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireAdmin, requireOwnershipOrAdmin, requireEntityOwnershipOrAdmin } from "../middlewares/auth.middleware.js";
import {
  createCuotaSchema,
  generarCuotasMesSchema,
  updateCuotaSchema,
  registrarPagoCuotaSchema,
  cuotaIdParamSchema,
  queryCuotaSchema,
} from "../schemas/cuota.schema.js";

const router = Router();

/**
 * @route   POST /api/cuotas
 * @desc    Crear una cuota mensual individual (solo administradores)
 */
router.post(
  "/",
  requireAdmin,
  validate({ body: createCuotaSchema }),
  cuotaController.create
);

/**
 * @route   POST /api/cuotas/generar-mes
 * @desc    Generación masiva de cuotas del mes para alumnos con contrato vigente (solo administradores)
 */
router.post(
  "/generar-mes",
  requireAdmin,
  validate({ body: generarCuotasMesSchema }),
  cuotaController.generarCuotasMes
);

/**
 * @route   GET /api/cuotas
 * @desc    Obtener lista de cuotas con filtros, métricas de recaudación y paginación
 */
router.get(
  "/",
  validate({ query: queryCuotaSchema }),
  requireOwnershipOrAdmin(),
  cuotaController.getAll
);

/**
 * @route   GET /api/cuotas/resumen/alumno/:id
 * @desc    Obtener balance y estado financiero consolidado de un alumno (cuotas + multas)
 */
router.get(
  "/resumen/alumno/:id",
  validate({ params: cuotaIdParamSchema }),
  requireOwnershipOrAdmin((req) => req.params.id),
  cuotaController.getBalanceAlumno
);

/**
 * @route   GET /api/cuotas/:id
 * @desc    Obtener el detalle de una cuota por su ID (titular o administrador)
 */
router.get(
  "/:id",
  validate({ params: cuotaIdParamSchema }),
  requireEntityOwnershipOrAdmin("cuota"),
  cuotaController.getById
);

/**
 * @route   PUT /api/cuotas/:id
 * @desc    Actualizar parcialmente los datos de una cuota (solo administradores)
 */
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: cuotaIdParamSchema,
    body: updateCuotaSchema,
  }),
  cuotaController.update
);

/**
 * @route   POST /api/cuotas/:id/pagar
 * @desc    Registrar pago de una cuota (solo administradores)
 */
router.post(
  "/:id/pagar",
  requireAdmin,
  validate({
    params: cuotaIdParamSchema,
    body: registrarPagoCuotaSchema,
  }),
  cuotaController.registrarPago
);

/**
 * @route   DELETE /api/cuotas/:id
 * @desc    Eliminar una cuota por su ID (solo administradores)
 */
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: cuotaIdParamSchema }),
  cuotaController.delete
);

export default router;

