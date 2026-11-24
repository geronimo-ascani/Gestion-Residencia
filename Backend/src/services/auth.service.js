import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../utils/customErrors.js";

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

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
  }

  /**
   * Registra una sesión activa en la base de datos vinculada al token JWT emitido.
   */
  async #registrarSesion(idUsuario, token, remember = false) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const duracionMs = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiraEn = new Date(Date.now() + duracionMs);

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
    const { correo, contrasena, nombre, apellido, documento, telefono, rol } = data;

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
    await this.#registrarSesion(resultado.nuevoUsuario.idUsuario, token, false);

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

    if (!usuario) {
      throw new UnauthorizedError("El correo electrónico o la contraseña no son correctos");
    }

    if (usuario.estado === "suspendido" || usuario.estado === "inactivo") {
      throw new UnauthorizedError("Tu cuenta se encuentra suspendida o inactiva. Contactá a administración.");
    }

    // 2. Comparar hash de contraseña
    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

    if (!passwordValida) {
      throw new UnauthorizedError("El correo electrónico o la contraseña no son correctos");
    }

    // 3. Generar token JWT y persistir sesión
    const token = this.#generarToken(usuario, usuario.rol.rol, remember);
    await this.#registrarSesion(usuario.idUsuario, token, remember);

    return {
      token,
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
  async logout(tokenString) {
    if (tokenString) {
      const raw = tokenString.startsWith("Bearer ") ? tokenString.slice(7) : tokenString;
      const tokenHash = crypto.createHash("sha256").update(raw.trim()).digest("hex");

      await prisma.sesion.updateMany({
        where: { tokenHash, revocadaEn: null },
        data: { revocadaEn: new Date() },
      });
    }

    return { ok: true, message: "Sesión cerrada exitosamente" };
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
    });
  }

  /**
   * Solicita el restablecimiento de contraseña generando un token temporal.
   */
  async solicitarRestablecimiento({ correo }) {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase().trim() },
    });

    // Respuesta neutra por prevención de enumeración de cuentas
    if (!usuario) {
      return {
        ok: true,
        message: "Si el correo está registrado, se enviará un enlace de recuperación.",
      };
    }

    // Generar token criptográfico seguro
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validez

    await prisma.tokenRestablecimiento.create({
      data: {
        idUsuario: usuario.idUsuario,
        tokenHash,
        expiraEn,
      },
    });

    // Simular el canal de despacho seguro (consola/logs) sin exponer el token abiertamente en producción
    console.log(`[AUTH-EMAIL-SIMULATOR] Enlace de restablecimiento para ${usuario.correo}: /reset-password?token=${rawToken}`);

    return {
      ok: true,
      message: "Si el correo está registrado, se enviará un enlace de recuperación.",
      ...(env.NODE_ENV === "development" || env.NODE_ENV === "test" ? { resetToken: rawToken } : {}),
    };
  }

  /**
   * Restablece la contraseña utilizando un token válido.
   */
  async restablecerContrasena({ token, nuevaContrasena }) {
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
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
      // 1. Actualizar contraseña del usuario
      await tx.usuario.update({
        where: { idUsuario: registroToken.idUsuario },
        data: { contrasenaHash: nuevaHash },
      });

      // 2. Marcar token como consumido
      await tx.tokenRestablecimiento.update({
        where: { idToken: registroToken.idToken },
        data: { usadoEn: ahora },
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
  async changePassword(idUsuario, { contrasenaActual, nuevaContrasena }) {
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

    await prisma.usuario.update({
      where: { idUsuario },
      data: { contrasenaHash: nuevaHash },
    });

    return { message: "Contraseña actualizada exitosamente" };
  }
}

export const authService = new AuthService();
export default authService;
