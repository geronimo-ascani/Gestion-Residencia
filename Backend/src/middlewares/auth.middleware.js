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
      alumno: usuario.alumno,
    };

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

