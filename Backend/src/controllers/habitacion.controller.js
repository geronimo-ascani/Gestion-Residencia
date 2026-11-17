import { habitacionService } from "../services/habitacion.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Habitación
 * Maneja las solicitudes HTTP para habitaciones y asignaciones de alumnos.
 */
class HabitacionController {
  /**
   * POST /api/habitaciones
   */
  create = async (req, res, next) => {
    try {
      const nuevaHabitacion = await habitacionService.create(req.body);
      return successResponse(
        res,
        nuevaHabitacion,
        "Habitación registrada exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/habitaciones
   */
  getAll = async (req, res, next) => {
    try {
      const result = await habitacionService.getAll(req.query);
      return successResponse(
        res,
        result,
        "Listado de habitaciones obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/habitaciones/:id
   */
  getById = async (req, res, next) => {
    try {
      const habitacion = await habitacionService.getById(req.params.id);
      return successResponse(
        res,
        habitacion,
        "Detalle de la habitación obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/habitaciones/:id
   */
  update = async (req, res, next) => {
    try {
      const habitacionActualizada = await habitacionService.update(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        habitacionActualizada,
        "Habitación actualizada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/habitaciones/:id
   */
  delete = async (req, res, next) => {
    try {
      const habitacionEliminada = await habitacionService.delete(req.params.id);
      return successResponse(
        res,
        habitacionEliminada,
        "Habitación eliminada exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/habitaciones/:id/asignar
   */
  asignarAlumno = async (req, res, next) => {
    try {
      const asignacion = await habitacionService.asignarAlumno(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        asignacion,
        "Alumno asignado a la habitación exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/habitaciones/:id/desasignar
   */
  desasignarAlumno = async (req, res, next) => {
    try {
      const liberacion = await habitacionService.desasignarAlumno(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        liberacion,
        "Alumno desasignado de la habitación exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/habitaciones/:id/ocupantes
   */
  getOcupantes = async (req, res, next) => {
    try {
      const ocupantes = await habitacionService.getOcupantes(req.params.id);
      return successResponse(
        res,
        ocupantes,
        "Listado de ocupantes obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const habitacionController = new HabitacionController();
export default habitacionController;
