/* =========================================================
   SUGERENCIA POR CATEGORÍA
   El texto que aparece en el "Plan de descongelamiento"
   para ayudar a vender un producto que se quedó en el freezer.
   ========================================================= */

/* "Menú Café" → "menu cafe": sin tildes y en minúscula */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function sugerenciaPorCategoria(
  categoria: string | null | undefined,
  unidades: number,
): string {
  // Caso especial: nadie lo pidió nunca
  if (unidades === 0) {
    return "Nadie lo pidió todavía: revisá que esté visible en el menú y que tenga una buena foto.";
  }

  const nombre = normalizar(categoria ?? "");

  if (nombre.includes("combo")) {
    return "Bajale un poco el precio por tiempo limitado y destacalo en la portada de la app.";
  }
  if (nombre.includes("hamburguesa")) {
    return "Sumala a un combo con papas y bebida a precio cerrado.";
  }
  if (nombre.includes("papa")) {
    return "Ofrecelas como \"agrandá tu combo\" por una diferencia chica.";
  }
  if (nombre.includes("nugget")) {
    return "Probá un \"agregá nuggets\" a mitad de precio con cualquier hamburguesa.";
  }
  if (nombre.includes("menu cafe")) {
    return "Sumalo de regalo en los desayunos durante una semana para que la gente lo pruebe.";
  }
  if (nombre === "cafe") {
    return "Armá un 2x1 en cafés por la tarde, la franja con menos pedidos.";
  }
  if (nombre.includes("bebida")) {
    return "Incluila como opción de bebida dentro de los combos.";
  }
  if (nombre.includes("postre")) {
    return "Ofrecelo a mitad de precio al confirmar un pedido grande.";
  }

  // Cualquier otra categoría
  return "Probá un 2x1 por tiempo limitado y fijate si suben las ventas.";
}