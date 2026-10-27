import { Router } from "express";
import alumnoRoutes from "./alumno.routes.js";

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
apiRouter.use("/alumnos", alumnoRoutes);

export default apiRouter;
