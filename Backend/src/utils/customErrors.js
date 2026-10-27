/**
 * Clases de error personalizadas para manejo de errores de aplicación y dominio.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Solicitud inválida", details = null) {
    super(message, 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto con un recurso existente") {
    super(message, 409);
  }
}
