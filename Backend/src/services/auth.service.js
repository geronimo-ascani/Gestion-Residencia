import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { hashToken } from "../utils/session.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import {
  UnauthorizedError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../utils/customErrors.js";

const HASH_DE_COMPARACION = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);

/**
 * Capa de Servicio: Autenticación, Sesiones y Recuperación de Acceso
 */
class AuthService {
  /**
   * Genera un token JWT firmado para el usuario.
   */
  #generarToken(usuario, rolNombre, remember = false) {
    const payload = {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      idRol: usuario.idRol,
      rol: rolNombre,
    };

    const expiresIn = remember ? "30d" : env.JWT_EXPIRES_IN;

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn, algorithm: "HS256", jwtid: crypto.randomUUID() });
  }

  /**
   * Registra una sesión activa en la base de datos vinculada al token JWT emitido.
   */
  async #registrarSesion(idUsuario, token) {
    const tokenHash = hashToken(token);
    const expiraEn = new Date(jwt.decode(token).exp * 1000);

    return await prisma.sesion.create({
      data: {
        idUsuario,
        tokenHash,
        expiraEn,
      },
    });
  }

  /**
   * Registra un nuevo usuario en el sistema y crea su sesión inicial.
   */
  async register(data) {
    if (env.NODE_ENV === "production") {
      throw new ForbiddenError("Solicitá tu cuenta a la administración de la residencia.");
    }
    const { correo, contrasena, nombre, apellido, documento, telefono } = data;

    // 1. Verificar si el correo ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (usuarioExistente) {
      throw new ConflictError(`Ya existe una cuenta registrada con el correo: ${correo}`);
    }

    // 2. Verificar o asignar Rol (en registro público siempre se asigna ALUMNO para evitar escalamiento de privilegios)
    const nombreRol = "ALUMNO";
    let rolRegistro = await prisma.rol.findUnique({
      where: { rol: nombreRol },
    });

    if (!rolRegistro) {
      rolRegistro = await prisma.rol.create({
        data: { rol: nombreRol },
      });
    }

    // 3. Hashear contraseña con bcrypt (cost factor 10)
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    // 4. Si se provee documento, verificar unicidad de alumno
    if (documento) {
      const docExistente = await prisma.alumno.findUnique({
        where: { documento },
      });
      if (docExistente) {
        throw new ConflictError(`Ya existe un alumno con el documento: ${documento}`);
      }
    }

    // 5. Crear usuario (y alumno si corresponde) en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          correo,
          contrasenaHash,
          idRol: rolRegistro.idRol,
          nombre: nombre || null,
          apellido: apellido || null,
          documento: documento || null,
          telefono: telefono || null,
        },
      });

      let perfilAlumno = null;

      if (nombre || documento) {
        perfilAlumno = await tx.alumno.create({
          data: {
            nombre: nombre || "Nombre",
            apellido: apellido || "Apellido",
            documento: documento || `DOC-${nuevoUsuario.idUsuario}`,
            telefono: telefono || null,
            estado: "activo",
          },
        });

        await tx.usuario.update({
          where: { idUsuario: nuevoUsuario.idUsuario },
          data: { idAlumno: perfilAlumno.idAlumno },
        });
      }

      return { nuevoUsuario, perfilAlumno };
    });

    // 6. Generar token JWT y registrar sesión
    const token = this.#generarToken(resultado.nuevoUsuario, rolRegistro.rol);
    await this.#registrarSesion(resultado.nuevoUsuario.idUsuario, token);

    return {
      token,
      usuario: {
        idUsuario: resultado.nuevoUsuario.idUsuario,
        correo: resultado.nuevoUsuario.correo,
        rol: rolRegistro.rol,
        alumno: resultado.perfilAlumno,
      },
    };
  }

  /**
   * Inicia sesión con correo y contraseña, registrando la sesión activa en BD.
   */
  async login({ correo, contrasena, remember }) {
    // 1. Buscar usuario con su rol y perfil de alumno
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      include: {
        rol: true,
        alumno: {
          select: {
            idAlumno: true,
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            estado: true,
          },
        },
      },
    });

    const passwordValida = await bcrypt.compare(contrasena, usuario?.contrasenaHash ?? HASH_DE_COMPARACION);
    const rol = usuario?.rol.rol.toUpperCase();
    if (!passwordValida || usuario?.estado !== "activo" ||
        (rol !== "ADMINISTRADOR" && (rol !== "ALUMNO" || usuario.alumno?.estado !== "activo"))) {
      throw new UnauthorizedError("El correo electrónico o la contraseña no son correctos, o la cuenta no está habilitada.");
    }

    // 3. Generar token JWT y persistir sesión
    const token = this.#generarToken(usuario, usuario.rol.rol, remember);
    const { expiraEn } = await this.#registrarSesion(usuario.idUsuario, token);

    return {
      token,
      expiraEn,
      usuario: {
        idUsuario: usuario.idUsuario,
        correo: usuario.correo,
        rol: usuario.rol.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        alumno: usuario.alumno,
      },
    };
  }

  /**
   * Cierra sesión revocando el token activo en la base de datos.
   */
  async logout(idSesion) {
    await prisma.sesion.updateMany({
      where: { idSesion, revocadaEn: null },
      data: { revocadaEn: new Date() },
    });
    return { ok: true };
  }

  /**
   * Lista las sesiones registradas del usuario.
   */
  async listarSesiones(idUsuario) {
    const ahora = new Date();
    const sesiones = await prisma.sesion.findMany({
      where: { idUsuario: Number(idUsuario) },
      orderBy: { creadaEn: "desc" },
    });

    return sesiones.map((s) => ({
      idSesion: s.idSesion,
      creadaEn: s.creadaEn.toISOString(),
      expiraEn: s.expiraEn.toISOString(),
      revocadaEn: s.revocadaEn ? s.revocadaEn.toISOString() : null,
      activa: !s.revocadaEn && s.expiraEn > ahora,
    }));
  }

  /**
   * Revoca una sesión específica.
   */
  async revocarSesion(idSesion, idUsuario) {
    const sesion = await prisma.sesion.findUnique({
      where: { idSesion: Number(idSesion) },
    });

    if (!sesion || sesion.idUsuario !== Number(idUsuario)) {
      throw new NotFoundError("Sesión no encontrada o no autorizada.");
    }

    return await prisma.sesion.update({
      where: { idSesion: Number(idSesion) },
      data: { revocadaEn: new Date() },
      select: { idSesion: true, revocadaEn: true },
    });
  }

  /**
   * Solicita el restablecimiento de contraseña generando un token temporal.
   */
  async solicitarRestablecimiento({ correo }) {
    const respuesta = { ok: true, message: "Si necesitás recuperar el acceso, contactá a la administración." };
    // La entrega de enlaces requiere un canal de correo que todavía no está configurado.
    if (env.NODE_ENV !== "test") return respuesta;

    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase().trim() },
    });
    if (usuario?.estado !== "activo") return respuesta;

    // Generar token criptográfico seguro
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validez

    await prisma.tokenRestablecimiento.create({
      data: {
        idUsuario: usuario.idUsuario,
        tokenHash,
        expiraEn,
      },
    });

    return { ...respuesta, resetToken: rawToken };
  }

  /**
   * Restablece la contraseña utilizando un token válido.
   */
  async restablecerContrasena({ token, nuevaContrasena }) {
    if (env.NODE_ENV !== "test") {
      throw new ForbiddenError("Contactá a la administración para recuperar tu cuenta.");
    }
    const tokenHash = hashToken(token.trim());
    const ahora = new Date();

    const registroToken = await prisma.tokenRestablecimiento.findFirst({
      where: {
        tokenHash,
        usadoEn: null,
        expiraEn: { gt: ahora },
      },
    });

    if (!registroToken) {
      throw new BadRequestError("El enlace o código de recuperación es inválido o ha expirado.");
    }

    const salt = await bcrypt.genSalt(10);
    const nuevaHash = await bcrypt.hash(nuevaContrasena, salt);

    await prisma.$transaction(async (tx) => {
      const actualizado = await tx.usuario.updateMany({
        where: { idUsuario: registroToken.idUsuario, estado: "activo" },
        data: { contrasenaHash: nuevaHash },
      });
      if (!actualizado.count) throw new BadRequestError("El enlace de recuperación es inválido o ha expirado.");

      const consumido = await tx.tokenRestablecimiento.updateMany({
        where: { idToken: registroToken.idToken, usadoEn: null, expiraEn: { gt: new Date() } },
        data: { usadoEn: ahora },
      });
      if (!consumido.count) throw new BadRequestError("El enlace de recuperación es inválido o ha expirado.");
      await tx.tokenRestablecimiento.deleteMany({
        where: { idUsuario: registroToken.idUsuario, usadoEn: null },
      });

      // 3. Revocar sesiones activas por seguridad
      await tx.sesion.updateMany({
        where: { idUsuario: registroToken.idUsuario, revocadaEn: null },
        data: { revocadaEn: ahora },
      });
    });

    return {
      ok: true,
      message: "Contraseña restablecida exitosamente. Ya podés iniciar sesión con tu nueva clave.",
    };
  }

  /**
   * Obtiene los datos del perfil del usuario actualmente autenticado.
   */
  async getProfile(idUsuario) {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        correo: true,
        nombre: true,
        apellido: true,
        documento: true,
        telefono: true,
        estado: true,
        gestionaAdministradores: true,
        fechaAlta: true,
        rol: {
          select: {
            idRol: true,
            rol: true,
          },
        },
        alumno: {
          include: {
            contratos: {
              where: { estado: "VIGENTE" },
            },
            habitacionesAlumnos: {
              where: {
                fechaDesde: { lte: new Date(FECHA_REFERENCIA) },
                OR: [{ fechaHasta: null }, { fechaHasta: { gt: new Date(FECHA_REFERENCIA) } }],
              },
              include: { habitacion: true },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundError("No se encontró el perfil de usuario");
    }

    return usuario;
  }

  /**
   * Cambia la contraseña de un usuario autenticado.
   */
  async changePassword(idUsuario, { contrasenaActual, nuevaContrasena }, idSesion) {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario },
    });

    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const valida = await bcrypt.compare(contrasenaActual, usuario.contrasenaHash);
    if (!valida) {
      throw new BadRequestError("La contraseña actual ingresada es incorrecta");
    }

    const salt = await bcrypt.genSalt(10);
    const nuevaHash = await bcrypt.hash(nuevaContrasena, salt);

    await prisma.$transaction(async (tx) => {
      const actualizado = await tx.usuario.updateMany({
        where: { idUsuario, estado: "activo", contrasenaHash: usuario.contrasenaHash },
        data: { contrasenaHash: nuevaHash },
      });
      if (!actualizado.count) throw new ConflictError("La contraseña cambió. Volvé a intentar.");

      await tx.sesion.updateMany({
        where: { idUsuario, idSesion: { not: idSesion }, revocadaEn: null },
        data: { revocadaEn: new Date() },
      });
      await tx.tokenRestablecimiento.deleteMany({ where: { idUsuario, usadoEn: null } });
    });

    return { message: "Contraseña actualizada exitosamente" };
  }
}

export const authService = new AuthService();
export default authService;
