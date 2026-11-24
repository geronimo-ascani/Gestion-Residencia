import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from "../utils/customErrors.js";

import { hashToken, sessionCookie } from "../utils/session.js";

// La API acepta Bearer para clientes externos y una cookie HttpOnly para el navegador.
export const authenticate = async (req, res, next) => {
  try {
    const authorization = req.get("Authorization");
    const cookie = req.get("Cookie")?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${sessionCookie}=`));
    const token = authorization
      ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
      : cookie?.slice(sessionCookie.length + 1);

    if (!token) throw new UnauthorizedError("Se requiere una sesión válida.");
    if (!authorization && !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        req.get("X-Residencia-Request") !== "browser") {
      throw new ForbiddenError("Solicitud de navegador no autorizada.");
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      throw new UnauthorizedError("La sesión es inválida o ha expirado.");
    }
    if (!Number.isSafeInteger(payload?.idUsuario) || payload.idUsuario <= 0) {
      throw new UnauthorizedError("La sesión es inválida.");
    }

    const sesion = await prisma.sesion.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        idSesion: true,
        idUsuario: true,
        expiraEn: true,
        revocadaEn: true,
        usuario: {
          select: {
            correo: true,
            nombre: true,
            apellido: true,
            idRol: true,
            estado: true,
            gestionaAdministradores: true,
            rol: { select: { rol: true } },
            alumno: { select: { idAlumno: true, nombre: true, apellido: true, estado: true } },
          },
        },
      },
    });
    if (!sesion || sesion.idUsuario !== payload.idUsuario || sesion.revocadaEn ||
        sesion.expiraEn <= new Date() || sesion.usuario.estado !== "activo") {
      throw new UnauthorizedError("La sesión es inválida o ha expirado.");
    }

    const usuario = sesion.usuario;
    const cuentaEsperada = req.get("X-Residencia-Account");
    if (cuentaEsperada && cuentaEsperada !== String(sesion.idUsuario)) {
      throw new UnauthorizedError("La cuenta de esta pestaña cambió. Volvé a iniciar sesión.");
    }
    const rol = usuario.rol.rol.toUpperCase();
    if (rol !== "ADMINISTRADOR" && (rol !== "ALUMNO" || !usuario.alumno ||
        usuario.alumno.estado !== "activo")) {
      throw new ForbiddenError("La cuenta no está habilitada para acceder.");
    }
    req.user = {
      idUsuario: sesion.idUsuario,
      idSesion: sesion.idSesion,
      correo: usuario.correo,
      nombre: [usuario.alumno?.nombre ?? usuario.nombre, usuario.alumno?.apellido ?? usuario.apellido]
        .filter(Boolean).join(" "),
      idRol: usuario.idRol,
      rol,
      gestionaAdministradores: usuario.gestionaAdministradores,
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

/**
 * Middleware de Autorización por Titularidad o Administrador.
 * Permite acceso irrestricto si el usuario tiene rol ADMINISTRADOR.
 * Si es ALUMNO, valida que el idAlumno del recurso solicitado coincida con req.user.alumno.idAlumno.
 *
 * @param {Function} [extractor] - Función opcional (req) => idAlumno
 */
export const requireOwnershipOrAdmin = (extractor) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError("Se requiere iniciar sesión para acceder a este recurso.")
      );
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

      if (!alumnoSesion || (targetId != null && Number(targetId) !== alumnoSesion) ||
          (targetId == null && req.method !== "GET" && req.method !== "HEAD")) {
        return next(
          new ForbiddenError("Acceso denegado: solo puedes consultar o gestionar tus propios datos.")
        );
      }

      // Si no se pasó ID específico en una consulta GET, auto-filtrar por su propio ID
      if (targetId == null) {
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
export const requireAdmin = (req, res, next) => {
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
        return next(
          new UnauthorizedError("Se requiere iniciar sesión para acceder a este recurso.")
        );
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
          return next(new NotFoundError(`No se encontró el recurso solicitado en ${modelName}.`));
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


