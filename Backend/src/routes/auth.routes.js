import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
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
 * @desc    Cerrar sesión
 */
router.post("/logout", authController.logout);
router.post("/sign-out", authController.logout);

export default router;

