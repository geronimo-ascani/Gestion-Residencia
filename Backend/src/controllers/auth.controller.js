import { authService } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Autenticación
 * Maneja el registro, inicio de sesión, perfil y seguridad de usuarios.
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
  logout = async (req, res) => {
    // Para JWT stateless, el cliente simplemente descarta el token
    return successResponse(
      res,
      null,
      "Sesión cerrada exitosamente",
      200
    );
  };
}

export const authController = new AuthController();
export default authController;

