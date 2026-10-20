const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/**
 * Formateo manual (sin `Intl`) para que el HTML del servidor y el del cliente
 * coincidan exactamente y no haya errores de hidratación.
 */
function agrupar(valor: number): string {
  return Math.trunc(Math.abs(valor))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatNumero(valor: number): string {
  return `${valor < 0 ? "-" : ""}${agrupar(valor)}`;
}

export function formatARS(valor: number): string {
  return `${valor < 0 ? "-" : ""}$ ${agrupar(valor)}`;
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return iso;
  return `${dia}/${mes}/${anio}`;
}

export function formatMes(mesAsociado: string): string {
  const [anio, mes] = mesAsociado.split("-");
  const nombre = MESES[Number(mes) - 1];
  return nombre ? `${nombre} ${anio}` : mesAsociado;
}

export function formatMesCorto(mesAsociado: string): string {
  const mes = Number(mesAsociado.split("-")[1]);
  return MESES_CORTOS[mes - 1] ?? mesAsociado;
}

export function formatPorcentaje(valor: number): string {
  return `${Math.round(valor)}%`;
}

export function iniciales(nombre: string, apellido?: string): string {
  const partes = `${nombre} ${apellido ?? ""}`.trim().split(/\s+/);
  const primera = partes[0]?.charAt(0) ?? "";
  const segunda = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
  return `${primera}${segunda}`.toUpperCase();
}

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
