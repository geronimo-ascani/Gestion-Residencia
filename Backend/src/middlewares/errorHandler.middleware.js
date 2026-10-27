import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/customErrors.js";
import { env } from "../config/env.js";

/**
 * Middleware centralizado para el manejo de errores.
 * Captura y estandariza errores de Zod, Prisma, AppError y excepciones no controladas.
 * Oculta trazas y detalles internos de la base de datos en entornos de producción.
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";
  let errors = err.details || null;

  // 1. Manejo de errores de validación de Zod
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Error de validación en los datos de la petición";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }
  // 2. Manejo de errores conocidos del cliente de Prisma
  else if (err instanceof Prisma.PrismaClientKnownRequestError || err.name === "PrismaClientKnownRequestError") {
    switch (err.code) {
      case "P2002": {
        statusCode = 409;
        const targetFields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(", ") : err.meta.target) : "campo único";
        message = `Conflicto: Ya existe un registro con el mismo valor en: ${targetFields}`;
        break;
      }
      case "P2025": {
        statusCode = 404;
        message = err.meta?.cause ? String(err.meta.cause) : "El registro solicitado no fue encontrado";
        break;
      }
      case "P2003": {
        statusCode = 400;
        message = "Violación de restricción de clave foránea en la base de datos";
        break;
      }
      default: {
        statusCode = 400;
        message = "Error en la operación de base de datos";
        break;
      }
    }
  }
  // 3. Manejo de errores de validación generales de Prisma (ej: tipos inválidos)
  else if (err instanceof Prisma.PrismaClientValidationError || err.name === "PrismaClientValidationError") {
    statusCode = 400;
    message = "Parámetros de consulta a la base de datos inválidos o incompletos";
  }
  // 4. Manejo de errores de inicialización y conexión de Prisma
  else if (err instanceof Prisma.PrismaClientInitializationError || err.name === "PrismaClientInitializationError") {
    statusCode = 503;
    message = "Error de conexión o autenticación con la base de datos PostgreSQL. Verifica las credenciales en el archivo .env y que el servicio esté activo.";
  }
  // 4. Manejo de AppError / Errores operacionales
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  }

  // Log de errores en el servidor (únicamente errores 500 no controlados)
  if (statusCode >= 500) {
    console.error("[ERROR 500 NO CONTROLADO]:", err);
  }

  // Respuesta HTTP formateada
  const response = {
    status: `${statusCode}`.startsWith("4") ? "fail" : "error",
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
};

export default errorHandler;
