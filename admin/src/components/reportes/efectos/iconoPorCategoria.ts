import type { TipoIcono } from "./IconosComida";

/* =========================================================
   CATEGORÍA → ÍCONO
   Traduce el nombre de la categoría (como viene de la base)
   al ícono que se dibuja en los reportes.
   ========================================================= */

/* "Menú Café" → "menu cafe": sin tildes y en minúscula */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function iconoPorCategoria(categoria: string | null | undefined): TipoIcono {
  const nombre = normalizar(categoria ?? "");

  if (nombre.includes("papa")) return "papas";
  if (nombre.includes("bebida") || nombre === "cafe") return "bebida";
  if (nombre.includes("nugget")) return "nugget";
  if (nombre.includes("postre") || nombre.includes("menu cafe") || nombre.includes("desayuno")) return "postre";

  // Hamburguesas, Combos y cualquier categoría nueva
  return "hamburguesa";
}