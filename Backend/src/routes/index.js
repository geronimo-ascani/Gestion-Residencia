import { Router } from "express";
import authRoutes from "./auth.routes.js";
import alumnoRoutes from "./alumno.routes.js";
import habitacionRoutes from "./habitacion.routes.js";
import contratoRoutes from "./contrato.routes.js";
import facturaRoutes from "./factura.routes.js";
import pagoRoutes from "./pago.routes.js";
import cuotaRoutes from "./cuota.routes.js";
import multaRoutes from "./multa.routes.js";
import grupoLimpiezaRoutes from "./grupoLimpieza.routes.js";
import ambienteRoutes from "./ambiente.routes.js";
import reclamoRoutes from "./reclamo.routes.js";
import administracionRoutes from "./administracion.routes.js";

const apiRouter = Router();

/**
 * Health check de la API
 */
apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Servicio de Residencia Estudiantil activo y saludable",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Enrutadores por módulo del sistema
 */
apiRouter.use("/auth", authRoutes);
apiRouter.use("/alumnos", alumnoRoutes);
apiRouter.use("/habitaciones", habitacionRoutes);
apiRouter.use("/contratos", contratoRoutes);
apiRouter.use("/facturas", facturaRoutes);
apiRouter.use("/facturacion", facturaRoutes);
apiRouter.use("/pagos", pagoRoutes);
apiRouter.use("/cobros", pagoRoutes);
apiRouter.use("/cuotas", cuotaRoutes);
apiRouter.use("/multas", multaRoutes);
apiRouter.use("/grupos-limpieza", grupoLimpiezaRoutes);
apiRouter.use("/limpieza", grupoLimpiezaRoutes);
apiRouter.use("/tareas-limpieza", grupoLimpiezaRoutes);
apiRouter.use("/ambientes", ambienteRoutes);
apiRouter.use("/reclamos", reclamoRoutes);
apiRouter.use("/administracion", administracionRoutes);
apiRouter.use("/parametros", administracionRoutes);
apiRouter.use("/notificaciones", administracionRoutes);
apiRouter.use("/auditoria", administracionRoutes);

export default apiRouter;
