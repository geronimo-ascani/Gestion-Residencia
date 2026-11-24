import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { ForbiddenError, NotFoundError } from "./utils/customErrors.js";

const app = express();
const origins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY_HOPS);

app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  });
  if (env.NODE_ENV === "production") res.set("Strict-Transport-Security", "max-age=31536000");
  const origin = req.get("Origin");
  if (origin && !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !origins.includes(origin) && req.get("Sec-Fetch-Site") !== "same-origin") {
    return next(new ForbiddenError("Origen de la solicitud no autorizado."));
  }
  return next();
});

// Middlewares globales de seguridad y utilidades
app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);

if (env.NODE_ENV !== "test") app.use(morgan((tokens, req, res) =>
  `${tokens.method(req, res)} ${req.path} ${tokens.status(req, res)} ${tokens["response-time"](req, res)} ms`
));
app.use(express.json({ limit: "20kb", inflate: false }));
app.use(express.urlencoded({ extended: false, limit: "20kb", inflate: false }));

// Silenciar favicon para evitar logs 404 en la terminal
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Enrutador principal de la API
app.use("/api", apiRouter);

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  next(new NotFoundError("Ruta no encontrada."));
});

// Middleware centralizado de manejo de errores (siempre al final)
app.use(errorHandler);

export default app;
