import { alumnoService } from "../services/alumno.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Alumno
 * Maneja las solicitudes HTTP entrantes, invoca el servicio correspondiente y envía respuestas formateadas.
 */
class AlumnoController {
  /**
   * POST /api/alumnos
   */
  create = async (req, res, next) => {
    try {
      const nuevoAlumno = await alumnoService.create(req.body);
      return successResponse(res, nuevoAlumno, "Alumno registrado exitosamente", 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/alumnos
   */
  getAll = async (req, res, next) => {
    try {
      const result = await alumnoService.getAll(req.query);
      return successResponse(res, result, "Listado de alumnos obtenido con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/alumnos/:id
   */
  getById = async (req, res, next) => {
    try {
      const alumno = await alumnoService.getById(req.params.id);
      return successResponse(res, alumno, "Datos del alumno obtenidos con éxito", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/alumnos/:id
   */
  update = async (req, res, next) => {
    try {
      const alumnoActualizado = await alumnoService.update(req.params.id, req.body);
      return successResponse(res, alumnoActualizado, "Alumno actualizado exitosamente", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/alumnos/:id
   */
  delete = async (req, res, next) => {
    try {
      const alumnoEliminado = await alumnoService.delete(req.params.id);
      return successResponse(res, alumnoEliminado, "Alumno eliminado exitosamente", 200);
    } catch (error) {
      return next(error);
    }
  };
}

export const alumnoController = new AlumnoController();
export default alumnoController;
