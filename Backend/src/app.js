import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { optionalAuthenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { NotFoundError } from "./utils/customErrors.js";

const app = express();

// Middlewares globales de seguridad y utilidades
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Middleware de autenticación contextual (extrae usuario si viene token Bearer)
app.use(optionalAuthenticate);

// Silenciar favicon para evitar logs 404 en la terminal
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Enrutador principal de la API
app.use("/api", apiRouter);

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

// Middleware centralizado de manejo de errores (siempre al final)
app.use(errorHandler);

export default app;
