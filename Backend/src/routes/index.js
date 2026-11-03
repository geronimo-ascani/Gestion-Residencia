import { Router } from "express";
import authRoutes from "./auth.routes.js";
import alumnoRoutes from "./alumno.routes.js";
import habitacionRoutes from "./habitacion.routes.js";
import contratoRoutes from "./contrato.routes.js";
import cuotaRoutes from "./cuota.routes.js";
import multaRoutes from "./multa.routes.js";
import grupoLimpiezaRoutes from "./grupoLimpieza.routes.js";
import ambienteRoutes from "./ambiente.routes.js";

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
 * Enrutadores por módulo
 */
apiRouter.use("/auth", authRoutes);
apiRouter.use("/alumnos", alumnoRoutes);
apiRouter.use("/habitaciones", habitacionRoutes);
apiRouter.use("/contratos", contratoRoutes);
apiRouter.use("/cuotas", cuotaRoutes);
apiRouter.use("/multas", multaRoutes);
apiRouter.use("/grupos-limpieza", grupoLimpiezaRoutes);
apiRouter.use("/ambientes", ambienteRoutes);

export default apiRouter;

