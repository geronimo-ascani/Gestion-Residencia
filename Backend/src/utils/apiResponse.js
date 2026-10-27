/**
 * Helper estandarizado para respuestas exitosas de la API.
 *
 * @param {import("express").Response} res
 * @param {any} data - Carga útil de la respuesta
 * @param {string} message - Mensaje descriptivo
 * @param {number} statusCode - Código de estado HTTP (por defecto 200)
 */
export const successResponse = (res, data, message = "Operación exitosa", statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};
