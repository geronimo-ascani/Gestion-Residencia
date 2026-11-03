import { limpiezaService } from "../services/limpieza.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Capa de Controlador: Grupos de Limpieza
 * Maneja las solicitudes HTTP para grupos de aseo, miembros y turnos.
 */
class GrupoLimpiezaController {
  /**
   * POST /api/grupos-limpieza
   */
  create = async (req, res, next) => {
    try {
      const nuevoGrupo = await limpiezaService.createGrupo(req.body);
      return successResponse(
        res,
        nuevoGrupo,
        "Grupo de limpieza creado exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/grupos-limpieza
   */
  getAll = async (req, res, next) => {
    try {
      const result = await limpiezaService.getAllGrupos(req.query);
      return successResponse(
        res,
        result,
        "Listado de grupos de limpieza obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/grupos-limpieza/cronograma
   */
  getCronograma = async (req, res, next) => {
    try {
      const cronograma = await limpiezaService.getCronograma();
      return successResponse(
        res,
        cronograma,
        "Cronograma actual de limpieza obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/grupos-limpieza/:id
   */
  getById = async (req, res, next) => {
    try {
      const grupo = await limpiezaService.getGrupoById(req.params.id);
      return successResponse(
        res,
        grupo,
        "Detalle del grupo de limpieza obtenido con éxito",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/grupos-limpieza/:id
   */
  update = async (req, res, next) => {
    try {
      const grupoActualizado = await limpiezaService.updateGrupo(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        grupoActualizado,
        "Grupo de limpieza actualizado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/grupos-limpieza/:id
   */
  delete = async (req, res, next) => {
    try {
      const grupoEliminado = await limpiezaService.deleteGrupo(req.params.id);
      return successResponse(
        res,
        grupoEliminado,
        "Grupo de limpieza eliminado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/grupos-limpieza/:id/alumnos
   */
  agregarAlumno = async (req, res, next) => {
    try {
      const asignacion = await limpiezaService.agregarAlumnoAGrupo(
        req.params.id,
        req.body.idAlumno
      );
      return successResponse(
        res,
        asignacion,
        "Alumno añadido al grupo de limpieza exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/grupos-limpieza/:id/alumnos/:idAlumno
   */
  quitarAlumno = async (req, res, next) => {
    try {
      const liberacion = await limpiezaService.quitarAlumnoDeGrupo(
        req.params.id,
        req.params.idAlumno
      );
      return successResponse(
        res,
        liberacion,
        "Alumno quitado del grupo de limpieza exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/grupos-limpieza/:id/ambientes
   */
  asignarAmbiente = async (req, res, next) => {
    try {
      const asignacion = await limpiezaService.asignarAmbienteAGrupo(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        asignacion,
        "Ambiente asignado al grupo de limpieza exitosamente",
        201
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/grupos-limpieza/:id/ambientes/:idAmbiente/finalizar
   */
  finalizarTurnoAmbiente = async (req, res, next) => {
    try {
      const finalizado = await limpiezaService.finalizarTurnoAmbiente(
        req.params.id,
        req.params.idAmbiente,
        req.body
      );
      return successResponse(
        res,
        finalizado,
        "Turno de limpieza finalizado exitosamente",
        200
      );
    } catch (error) {
      return next(error);
    }
  };
}

export const grupoLimpiezaController = new GrupoLimpiezaController();
export default grupoLimpiezaController;

