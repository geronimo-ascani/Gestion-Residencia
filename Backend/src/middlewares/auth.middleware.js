import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { UnauthorizedError, ForbiddenError } from "../utils/customErrors.js";

/**
 * Middleware de Autenticación.
 * Extrae y valida el token Bearer JWT desde los headers de la petición.
 * Carga el usuario autenticado y su rol en `req.user`.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de autenticación no proporcionado. Debe usar 'Bearer <token>'");
    }

    const token = authHeader.split(" ")[1];
    let payload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw new UnauthorizedError("El token de sesión ha expirado. Por favor inicia sesión nuevamente.");
      }
      throw new UnauthorizedError("Token de autenticación inválido.");
    }

    // Verificar que el usuario continúe existiendo en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: payload.idUsuario },
      include: {
        rol: true,
        alumno: {
          select: {
            idAlumno: true,
            nombre: true,
            apellido: true,
            estado: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedError("El usuario asociado al token ya no existe en el sistema.");
    }

    // Inyectar en req.user
    req.user = {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      idRol: usuario.idRol,
      rol: usuario.rol.rol,
      gestionaAdministradores: usuario.gestionaAdministradores,
      alumno: usuario.alumno,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware de Autenticación Opcional.
 * Si se envía un token válido, inyecta req.user. Si no, continúa sin bloquear.
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: payload.idUsuario },
        include: {
          rol: true,
          alumno: {
            select: {
              idAlumno: true,
              nombre: true,
              apellido: true,
              estado: true,
            },
          },
        },
      });

      if (usuario) {
        req.user = {
          idUsuario: usuario.idUsuario,
          correo: usuario.correo,
          idRol: usuario.idRol,
          rol: usuario.rol.rol,
          gestionaAdministradores: usuario.gestionaAdministradores,
          alumno: usuario.alumno,
        };
      }
    } catch {
      // Token inválido o expirado en modo opcional no interrumpe
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware generador de Autorización basado en Roles (RBAC).
 *
 * @param  {...string} rolesPermitidos - Lista de roles permitidos (ej: "ADMINISTRADOR", "ALUMNO")
 */
export const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Usuario no autenticado"));
    }

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(req.user.rol)) {
      return next(
        new ForbiddenError(
          `Acceso denegado: se requiere uno de los roles [${rolesPermitidos.join(", ")}], pero tu rol es '${req.user.rol}'`
        )
      );
    }

    return next();
  };
};

/**
 * Middleware de Autorización por Titularidad o Administrador.
 * Permite acceso irrestricto si el usuario tiene rol ADMINISTRADOR.
 * Si es ALUMNO, valida que el idAlumno del recurso solicitado coincida con req.user.alumno.idAlumno.
 *
 * @param {Function} [extractor] - Función opcional (req) => idAlumno
 */
export const requireOwnershipOrAdmin = (extractor) => {
  return async (req, res, next) => {
    if (!req.user) {
      await new Promise((resolve) => optionalAuthenticate(req, res, resolve));
    }

    if (!req.user) {
      // Si no hay token en modo desarrollo o petición interna de bootstrap
      return next();
    }

    const rol = (req.user.rol || "").toUpperCase();
    if (rol === "ADMINISTRADOR") {
      return next();
    }

    if (rol === "ALUMNO") {
      const alumnoSesion = req.user.alumno?.idAlumno;
      let targetId = null;

      if (typeof extractor === "function") {
        targetId = extractor(req);
      } else {
        targetId = req.params.idAlumno || req.params.id || req.query.idAlumno || req.body?.idAlumno;
      }

      if (targetId && Number(targetId) !== Number(alumnoSesion)) {
        return next(
          new ForbiddenError("Acceso denegado: solo puedes consultar o gestionar tus propios datos.")
        );
      }

      // Si no se pasó ID específico en una consulta GET, auto-filtrar por su propio ID
      if (!targetId && req.method === "GET") {
        req.query.idAlumno = alumnoSesion;
      }

      return next();
    }

    return next(new ForbiddenError("Rol no autorizado para acceder a este recurso."));
  };
};

/**
 * Middleware que exige rol ADMINISTRADOR estricto.
 * Si el usuario es un alumno (o no es administrador), rechaza con 403 Forbidden.
 * Si no está autenticado, rechaza con 401 Unauthorized.
 */
export const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    await new Promise((resolve) => optionalAuthenticate(req, res, resolve));
  }

  if (!req.user) {
    return next(
      new UnauthorizedError("Se requiere iniciar sesión como administrador para realizar esta acción.")
    );
  }

  const rol = (req.user.rol || "").toUpperCase();
  if (rol !== "ADMINISTRADOR") {
    return next(
      new ForbiddenError("Acceso denegado: los alumnos no tienen permisos para realizar acciones administrativas.")
    );
  }

  return next();
};

/**
 * Middleware que verifica que el recurso específico pertenezca al alumno autenticado,
 * o bien permite el acceso irrestricto si el usuario es ADMINISTRADOR.
 *
 * @param {string} modelName - Nombre del modelo Prisma ('contrato', 'factura', 'pago', 'multa', 'reclamo', 'cuota')
 * @param {object} [options]
 * @param {string} [options.idParam='id'] - Nombre del parámetro en req.params
 * @param {string} [options.pkField] - Clave primaria en la tabla
 */
export const requireEntityOwnershipOrAdmin = (modelName, options = {}) => {
  const idParam = options.idParam || "id";
  const pkField = options.pkField || `id${modelName.charAt(0).toUpperCase() + modelName.slice(1)}`;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        await new Promise((resolve) => optionalAuthenticate(req, res, resolve));
      }

      if (!req.user) {
        return next();
      }

      const rol = (req.user.rol || "").toUpperCase();
      if (rol === "ADMINISTRADOR") {
        return next();
      }

      if (rol === "ALUMNO") {
        const alumnoSesion = req.user.alumno?.idAlumno;
        if (!alumnoSesion) {
          return next(new ForbiddenError("Acceso denegado: tu usuario no tiene un alumno asociado."));
        }

        const rawId = req.params[idParam];
        if (!rawId) {
          return next();
        }

        const recursoId = Number(rawId);
        if (isNaN(recursoId)) {
          return next(new BadRequestError(`Identificador inválido: ${rawId}`));
        }

        const modelDelegate = prisma[modelName];
        if (!modelDelegate) {
          return next(new Error(`Modelo Prisma no reconocido: ${modelName}`));
        }

        const record = await modelDelegate.findUnique({
          where: { [pkField]: recursoId },
          select: { idAlumno: true },
        });

        if (!record) {
          return next();
        }

        if (Number(record.idAlumno) !== Number(alumnoSesion)) {
          return next(
            new ForbiddenError("Acceso denegado: solo puedes consultar o gestionar tus propios datos.")
          );
        }

        return next();
      }

      return next(new ForbiddenError("Rol no autorizado para acceder a este recurso."));
    } catch (error) {
      return next(error);
    }
  };
};


