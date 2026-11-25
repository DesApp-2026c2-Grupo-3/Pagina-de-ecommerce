import type { CategoriaAdmin } from '../../types/categoria.types'

// Si la página empieza con una subcategoría cuya principal quedó en una página anterior de la misma lista,
// devuelve esa principal y su página (plan de Categorías v4, D-C6). Si la principal no está en la lista
// (otro estado o la búsqueda), devuelve null: alcanza con «Subcategoría de [Padre]» en la tarjeta.
export function principalQueContinua(
  filtradas: CategoriaAdmin[],
  pagina: number,
  porPagina: number,
): { nombre: string; pagina: number } | null {
  const inicio = (pagina - 1) * porPagina
  const primera = filtradas[inicio]
  if (!primera || primera.categoriaPadreId === null) return null
  const indicePadre = filtradas.findIndex((c) => c.id === primera.categoriaPadreId)
  if (indicePadre < 0 || indicePadre >= inicio) return null
  return { nombre: filtradas[indicePadre].nombre, pagina: Math.floor(indicePadre / porPagina) + 1 }
}
