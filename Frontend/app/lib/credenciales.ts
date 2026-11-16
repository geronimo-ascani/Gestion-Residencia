export function claveInicial(apellido: string, documento: string) {
  const primero = apellido.trim().split(/\s+/)[0];
  const dni = documento.replace(/\D/g, "");
  if (!primero || dni.length < 3) throw new Error("Completá el apellido y un DNI de al menos 3 dígitos.");
  return primero + dni.slice(-3);
}

export async function hashClave(clave: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clave));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
