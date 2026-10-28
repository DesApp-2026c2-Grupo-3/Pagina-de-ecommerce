// Reglas de las sugerencias del carrito ("Completá tu pedido").
// Los nombres son los de las categorías en la base (no importan mayúsculas ni tildes).
// El orden importa: lo primero de cada lista se sugiere primero.

/** Si el carrito tiene algo de la categoría de la izquierda, se sugieren las de la derecha */
export const COMPLEMENTOS: Record<string, string[]> = {
  Hamburguesas: ['Papas Fritas', 'Bebidas'],
  Combos: ['Postres', 'Nuggets'],
  'Papas Fritas': ['Hamburguesas', 'Bebidas'],
  Nuggets: ['Hamburguesas', 'Bebidas'],
  Ensaladas: ['Bebidas', 'Postres'],
  Café: ['Postres'],
  'Menú Café': ['Postres'],
  Postres: ['Café'],
  Bebidas: ['Hamburguesas', 'Papas Fritas'],
}

/** Categorías que ya traen otras adentro: un combo cuenta como que ya hay papas y bebida */
export const INCLUYE: Record<string, string[]> = {
  Combos: ['Papas Fritas', 'Bebidas'],
}