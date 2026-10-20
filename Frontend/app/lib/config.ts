export const NOMBRE_SISTEMA = "Gestión de Residencia";

/**
 * Costo de la cuota mensual.
 *
 * Decisión del modelo: el valor NO forma parte del diagrama de clases; se
 * administra como configuración de la aplicación. Si en el futuro la cuota
 * varía por alumno o por mes, debe moverse al modelo (`MontoEsperado`).
 */
export const MONTO_CUOTA_MENSUAL = 45_000;

/**
 * Fecha de referencia del prototipo (los datos mock se generan alrededor de
 * ella y todas las derivaciones usan el mismo valor). Al conectar el backend,
 * reemplazar por la fecha real del servidor.
 */
export const FECHA_REFERENCIA = "2026-10-20";

export const MES_ACTUAL = FECHA_REFERENCIA.slice(0, 7);
