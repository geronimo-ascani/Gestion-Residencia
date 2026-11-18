import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";

const router = Router();

/**
 * @route   POST /api/auth/register (y /api/auth/sign-up/email)
 * @desc    Crear una nueva cuenta de usuario y perfil de alumno
 */
router.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register
);
router.post(
  "/sign-up/email",
  validate({ body: registerSchema }),
  authController.register
);

/**
 * @route   POST /api/auth/login (y /api/auth/sign-in/email)
 * @desc    Iniciar sesión y obtener token JWT
 */
router.post(
  "/login",
  validate({ body: loginSchema }),
  authController.login
);
router.post(
  "/sign-in/email",
  validate({ body: loginSchema }),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener datos del usuario actualmente autenticado
 */
router.get("/me", authenticate, authController.me);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 */
router.put(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout (y /api/auth/sign-out)
 * @desc    Cerrar sesión revocando la sesión activa
 */
router.post("/logout", authController.logout);
router.post("/sign-out", authController.logout);

/**
 * @route   GET /api/auth/sesiones
 * @desc    Listar sesiones del usuario autenticado
 */
router.get("/sesiones", authenticate, authController.listarSesiones);

/**
 * @route   DELETE /api/auth/sesiones/:idSesion
 * @desc    Revocar una sesión activa del usuario
 */
router.delete("/sesiones/:idSesion", authenticate, authController.revocarSesion);

/**
 * @route   POST /api/auth/forget-password (y /api/auth/recuperar-clave)
 * @desc    Solicitar token de recuperación de contraseña
 */
router.post(
  "/forget-password",
  validate({ body: forgetPasswordSchema }),
  authController.forgetPassword
);
router.post(
  "/recuperar-clave",
  validate({ body: forgetPasswordSchema }),
  authController.forgetPassword
);

/**
 * @route   POST /api/auth/reset-password (y /api/auth/restablecer-clave)
 * @desc    Restablecer contraseña utilizando un token válido
 */
router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);
router.post(
  "/restablecer-clave",
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

export default router;
