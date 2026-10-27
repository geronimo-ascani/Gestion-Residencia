/**
 * Middleware generador para validación de peticiones HTTP con Zod.
 * Valida y sanitiza selectivamente req.body, req.query y req.params.
 *
 * @param {Object} schemas
 * @param {import("zod").ZodSchema} [schemas.body] - Esquema para el cuerpo de la petición
 * @param {import("zod").ZodSchema} [schemas.query] - Esquema para los query params
 * @param {import("zod").ZodSchema} [schemas.params] - Esquema para los route params
 */
export const validate = ({ body, query, params } = {}) => {
  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await body.parseAsync(req.body);
      }
      if (query) {
        req.query = await query.parseAsync(req.query);
      }
      if (params) {
        req.params = await params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      // Reenvía el error directamente al middleware centralizado de errores
      return next(error);
    }
  };
};

export default validate;
