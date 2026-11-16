export const CAMPOS_PARAMETROS = [
  { clave: "multaLeve", modulo: "Facturación y pagos", pantalla: "Multas", nombre: "Falta leve", unidad: "ARS", inicial: 10000, min: 0.01, max: 100000000, step: 0.01 },
  { clave: "multaModerada", modulo: "Facturación y pagos", pantalla: "Multas", nombre: "Falta moderada", unidad: "ARS", inicial: 25000, min: 0.01, max: 100000000, step: 0.01 },
  { clave: "multaGrave", modulo: "Facturación y pagos", pantalla: "Multas", nombre: "Falta grave", unidad: "ARS", inicial: 40000, min: 0.01, max: 100000000, step: 0.01 },
  { clave: "recargoMulta", modulo: "Facturación y pagos", pantalla: "Multas", nombre: "Recargo por vencimiento", unidad: "%", inicial: 20, min: 0, max: 100, step: 0.01 },
  { clave: "cuotaMensual", modulo: "Residentes", pantalla: "Contratos", nombre: "Cuota mensual predeterminada", unidad: "ARS", inicial: 180000, min: 0.01, max: 100000000, step: 0.01 },
  { clave: "deposito", modulo: "Residentes", pantalla: "Contratos", nombre: "Depósito de garantía predeterminado", unidad: "ARS", inicial: 0, min: 0, max: 100000000, step: 0.01 },
  { clave: "diaVencimiento", modulo: "Residentes", pantalla: "Contratos", nombre: "Día de vencimiento predeterminado", unidad: "día del mes", inicial: 10, min: 1, max: 31, step: 1 },
  { clave: "duracionContrato", modulo: "Residentes", pantalla: "Contratos", nombre: "Duración predeterminada", unidad: "días", inicial: 365, min: 1, max: 3650, step: 1 },
] as const;
export type ClaveParametro = typeof CAMPOS_PARAMETROS[number]["clave"];
export type Parametros = Record<ClaveParametro, number>;
export const PARAMETROS_INICIALES = Object.fromEntries(CAMPOS_PARAMETROS.map((c) => [c.clave, c.inicial])) as Parametros;
export function validarParametros(valores: Parametros) {
  for (const c of CAMPOS_PARAMETROS) {
    const v = valores[c.clave];
    if (!Number.isFinite(v) || v < c.min || v > c.max || (c.step === 1 && !Number.isInteger(v)) || Math.abs(v * 100 - Math.round(v * 100)) > 0.00001) throw new Error(`${c.nombre}: ingresá un valor entre ${c.min} y ${c.max}${c.step === 1 ? " sin decimales" : " con hasta dos decimales"}.`);
  }
}
export function arancelesMulta<T extends { id: string; monto: number }>(tipos: T[], valores: Parametros): T[] {
  return tipos.map((t) => ({ ...t, monto: t.id === "leve" ? valores.multaLeve : t.id === "moderada" ? valores.multaModerada : t.id === "grave" ? valores.multaGrave : t.monto }));
}
