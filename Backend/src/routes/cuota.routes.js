import { Router } from "express";
import { cuotaController } from "../controllers/cuota.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
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
 * @desc    Crear una cuota mensual individual
 */
router.post(
  "/",
  validate({ body: createCuotaSchema }),
  cuotaController.create
);

/**
 * @route   POST /api/cuotas/generar-mes
 * @desc    Generación masiva de cuotas del mes para alumnos con contrato vigente
 */
router.post(
  "/generar-mes",
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
  cuotaController.getAll
);

/**
 * @route   GET /api/cuotas/resumen/alumno/:id
 * @desc    Obtener balance y estado financiero consolidado de un alumno (cuotas + multas)
 */
router.get(
  "/resumen/alumno/:id",
  validate({ params: cuotaIdParamSchema }),
  cuotaController.getBalanceAlumno
);

/**
 * @route   GET /api/cuotas/:id
 * @desc    Obtener el detalle de una cuota por su ID
 */
router.get(
  "/:id",
  validate({ params: cuotaIdParamSchema }),
  cuotaController.getById
);

/**
 * @route   PUT /api/cuotas/:id
 * @desc    Actualizar parcialmente los datos de una cuota
 */
router.put(
  "/:id",
  validate({
    params: cuotaIdParamSchema,
    body: updateCuotaSchema,
  }),
  cuotaController.update
);

/**
 * @route   POST /api/cuotas/:id/pagar
 * @desc    Registrar pago de una cuota
 */
router.post(
  "/:id/pagar",
  validate({
    params: cuotaIdParamSchema,
    body: registrarPagoCuotaSchema,
  }),
  cuotaController.registrarPago
);

/**
 * @route   DELETE /api/cuotas/:id
 * @desc    Eliminar una cuota por su ID
 */
router.delete(
  "/:id",
  validate({ params: cuotaIdParamSchema }),
  cuotaController.delete
);

export default router;

