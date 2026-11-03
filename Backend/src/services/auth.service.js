import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../utils/customErrors.js";

/**
 * Capa de Servicio: Autenticación y Autorización
 * Gestiona el ciclo de vida de credenciales, contraseñas hash, roles y tokens JWT.
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
   * Registra un nuevo usuario en el sistema.
   * Si se proporcionan datos de nombre o documento, crea simultáneamente el perfil de Alumno asociado.
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

    // 2. Verificar o asignar Rol
    const nombreRol = rol.toUpperCase();
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
        },
      });

      let perfilAlumno = null;

      if (nombre || documento) {
        perfilAlumno = await tx.alumno.create({
          data: {
            idUsuario: nuevoUsuario.idUsuario,
            nombre: nombre || "Nombre",
            apellido: apellido || "Apellido",
            documento: documento || `DOC-${nuevoUsuario.idUsuario}`,
            telefono: telefono || null,
            estado: "ACTIVO",
          },
        });
      }

      return { nuevoUsuario, perfilAlumno };
    });

    // 6. Generar token JWT
    const token = this.#generarToken(resultado.nuevoUsuario, rolRegistro.rol);

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
   * Inicia sesión con correo y contraseña.
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

    // 2. Comparar hash de contraseña
    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

    if (!passwordValida) {
      throw new UnauthorizedError("El correo electrónico o la contraseña no son correctos");
    }

    // 3. Generar token JWT
    const token = this.#generarToken(usuario, usuario.rol.rol, remember);

    return {
      token,
      usuario: {
        idUsuario: usuario.idUsuario,
        correo: usuario.correo,
        rol: usuario.rol.rol,
        alumno: usuario.alumno,
      },
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
                OR: [{ fechaHasta: null }, { fechaHasta: { gt: new Date() } }],
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

