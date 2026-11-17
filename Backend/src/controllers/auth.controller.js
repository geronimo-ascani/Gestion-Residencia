import { authService } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Autenticación, Sesiones y Recuperación de Acceso
 */
class AuthController {
  /**
   * POST /api/auth/register (y alias /api/auth/sign-up/email)
   */
  register = async (req, res, next) => {
    try {
      const data = await authService.register(req.body);
      return successResponse(
        res,
        data,
        "Cuenta de usuario creada exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/auth/login (y alias /api/auth/sign-in/email)
   */
  login = async (req, res, next) => {
    try {
      const data = await authService.login(req.body);
      return successResponse(
        res,
        data,
        "Inicio de sesión exitoso",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/auth/me
   */
  me = async (req, res, next) => {
    try {
      const perfil = await authService.getProfile(req.user.idUsuario);
      return successResponse(
        res,
        perfil,
        "Perfil de usuario obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/auth/change-password
   */
  changePassword = async (req, res, next) => {
    try {
      const result = await authService.changePassword(
        req.user.idUsuario,
        req.body
      );
      return successResponse(
        res,
        result,
        "Contraseña actualizada con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/auth/logout (y alias /api/auth/sign-out)
   */
  logout = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const resultado = await authService.logout(authHeader);
      return successResponse(
        res,
        resultado,
        "Sesión cerrada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/auth/sesiones
   */
  listarSesiones = async (req, res, next) => {
    try {
      const sesiones = await authService.listarSesiones(req.user.idUsuario);
      return successResponse(
        res,
        sesiones,
        "Listado de sesiones obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/auth/sesiones/:idSesion
   */
  revocarSesion = async (req, res, next) => {
    try {
      const resultado = await authService.revocarSesion(
        req.params.idSesion,
        req.user.idUsuario
      );
      return successResponse(
        res,
        resultado,
        "Sesión revocada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/auth/forget-password (y /api/auth/recuperar-clave)
   */
  forgetPassword = async (req, res, next) => {
    try {
      const resultado = await authService.solicitarRestablecimiento(req.body);
      return successResponse(
        res,
        resultado,
        resultado.message,
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/auth/reset-password (y /api/auth/restablecer-clave)
   */
  resetPassword = async (req, res, next) => {
    try {
      const resultado = await authService.restablecerContrasena(req.body);
      return successResponse(
        res,
        resultado,
        resultado.message,
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const authController = new AuthController();
export default authController;
