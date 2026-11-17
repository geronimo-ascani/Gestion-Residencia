import type { Alumno } from "./types";

export const MODULOS_ALUMNO = {
  personales: "Datos personales",
  domicilio: "Domicilio",
  academica: "Información académica",
  emergencia: "Contactos de emergencia",
  adicional: "Información adicional",
} as const;

export type ModuloAlumno = keyof typeof MODULOS_ALUMNO;

export function esModuloAlumno(valor: string | undefined): valor is ModuloAlumno {
  return valor !== undefined && Object.hasOwn(MODULOS_ALUMNO, valor);
}

export function contactosDeAlumno(alumno: Alumno) {
  if (alumno.contactosEmergencia?.length) return alumno.contactosEmergencia;
  const { emergenciaNombre, emergenciaVinculo, emergenciaTelefono } = alumno;
  if (!emergenciaNombre && !emergenciaVinculo && !emergenciaTelefono) return [];
  return [{
    nombre: emergenciaNombre ?? "",
    vinculo: emergenciaVinculo ?? "",
    telefono: emergenciaTelefono ?? "",
  }];
}
