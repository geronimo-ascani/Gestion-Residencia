import { FECHA_REFERENCIA } from "./config";
import { asignacionesActivas, calcularOcupacion, contratoVigente, estadoContrato, esMultaVencida, semanaLimpieza, tareaLimpieza } from "./domain";
import { correspondeCuota, saldoFactura } from "./facturacion";
import type { DataState } from "./types";

/** Distingue los ingresos del mes de la deuda acumulada de facturas. */
export function resumenPanel(data: DataState) {
  const periodo = FECHA_REFERENCIA.slice(0, 7);
  const residentes = data.alumnos.filter((a) => a.estado === "activo" && contratoVigente(data.contratos, a.idAlumno));
  const idsResidentes = new Set(residentes.map((a) => a.idAlumno));
  const ocupacion = calcularOcupacion(data.habitaciones, data.asignaciones);
  const activas = asignacionesActivas(data.asignaciones);
  const pendientes = data.facturas.map((factura) => ({ factura, saldo: saldoFactura(factura, data.pagos) }))
    .filter(({ factura, saldo }) => saldo > 0 && factura.fechaEmision <= FECHA_REFERENCIA)
    .sort((a, b) => a.factura.fechaVence.localeCompare(b.factura.fechaVence) || a.factura.idFactura.localeCompare(b.factura.idFactura));
  const porVencer = data.contratos.filter((c) => estadoContrato(c) === "por-vencer")
    .sort((a, b) => a.fechaHasta.localeCompare(b.fechaHasta) || a.idContrato.localeCompare(b.idContrato));
  const pagosMes = data.pagos.filter((p) => p.fecha.startsWith(periodo) && p.fecha <= FECHA_REFERENCIA);
  const sinFacturar = data.contratos.filter((c) => correspondeCuota(c, periodo) &&
    !data.facturas.some((f) => f.idContrato === c.idContrato && f.periodo === periodo));
  const semana = semanaLimpieza();
  const grupos = data.grupos.map((grupo) => ({
    grupo,
    tarea: tareaLimpieza(grupo.tareaInicial, semana, data.tareasLimpieza),
    integrantes: data.grupoAlumnos.filter((a) => a.idGrupoLimpieza === grupo.idGrupoLimpieza && idsResidentes.has(a.idAlumno)).length,
  }));
  const residentesSinGrupo = residentes.filter((a) => !data.grupoAlumnos.some((g) => g.idAlumno === a.idAlumno)).length;
  return {
    periodo, residentes, ocupacion, pendientes, porVencer, sinFacturar, semana, grupos, residentesSinGrupo,
    cobradoMes: Math.round(pagosMes.reduce((s, p) => s + p.monto, 0) * 100) / 100,
    saldoPendiente: Math.round(pendientes.reduce((s, f) => s + f.saldo, 0) * 100) / 100,
    alumnosConSaldo: new Set(pendientes.map(({ factura }) => factura.idAlumno)).size,
    facturasVencidas: pendientes.filter(({ factura }) => factura.fechaVence < FECHA_REFERENCIA).length,
    multasVencidas: data.multas.filter((m) => esMultaVencida(m)).length,
    habitaciones: data.habitaciones.map((habitacion) => {
      const ocupadas = activas.filter((a) => a.idHabitacion === habitacion.idHabitacion).length;
      return { habitacion, ocupadas, libres: Math.max(0, habitacion.capacidadMaxima - ocupadas) };
    }).sort((a, b) => a.habitacion.numeroHabitacion.localeCompare(b.habitacion.numeroHabitacion, "es", { numeric: true })),
  };
}
