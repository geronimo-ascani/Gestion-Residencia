import { alumnoService } from "../services/alumno.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Alumno
 * Maneja las solicitudes HTTP relativas al padrón de residentes, fichas por sección y contactos de emergencia.
 */
class AlumnoController {
  /**
   * POST /api/alumnos
   * Registra un nuevo alumno con sus datos personales, académicos, de domicilio y emergencia.
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
   * Obtiene la lista paginada y filtrable de alumnos.
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
   * Obtiene la ficha integral del alumno por su ID.
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
   * Actualiza el perfil o secciones específicas del alumno.
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
   * Elimina un alumno del padrón.
   */
  delete = async (req, res, next) => {
    try {
      const alumnoEliminado = await alumnoService.delete(req.params.id);
      return successResponse(res, alumnoEliminado, "Alumno eliminado exitosamente", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/alumnos/:id/acceso
   * Da de alta o actualiza la cuenta de acceso de un alumno con su contraseña inicial encriptada.
   */
  crearAcceso = async (req, res, next) => {
    try {
      const result = await alumnoService.crearOActualizarAcceso(req.params.id, req.body);
      return successResponse(res, result, "Cuenta de acceso para el alumno creada/actualizada exitosamente", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/alumnos/:id/contactos-emergencia
   * Agrega un nuevo contacto de emergencia a un alumno.
   */
  addContacto = async (req, res, next) => {
    try {
      const contacto = await alumnoService.addContactoEmergencia(req.params.id, req.body);
      return successResponse(res, contacto, "Contacto de emergencia agregado exitosamente", 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/alumnos/:id/contactos-emergencia/:idContacto
   * Actualiza un contacto de emergencia existente.
   */
  updateContacto = async (req, res, next) => {
    try {
      const contactoActualizado = await alumnoService.updateContactoEmergencia(
        req.params.id,
        req.params.idContacto,
        req.body
      );
      return successResponse(res, contactoActualizado, "Contacto de emergencia actualizado exitosamente", 200);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/alumnos/:id/contactos-emergencia/:idContacto
   * Elimina un contacto de emergencia.
   */
  deleteContacto = async (req, res, next) => {
    try {
      const contactoEliminado = await alumnoService.deleteContactoEmergencia(
        req.params.id,
        req.params.idContacto
      );
      return successResponse(res, contactoEliminado, "Contacto de emergencia eliminado exitosamente", 200);
    } catch (error) {
      return next(error);
    }
  };
}

export const alumnoController = new AlumnoController();
export default alumnoController;
