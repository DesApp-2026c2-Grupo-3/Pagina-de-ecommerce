import type { CategoriaAdmin } from '../../types/categoria.types'

// Cada categoría principal seguida de sus hijas (Cafetería, y debajo Café y Menú Café).
// Movido tal cual desde la página de Categorías.
export function enOrdenJerarquico(lista: CategoriaAdmin[]): CategoriaAdmin[] {
  const ids = new Set(lista.map((c) => c.id))
  const resultado: CategoriaAdmin[] = []
  for (const c of lista) {
    if (c.categoriaPadreId !== null && ids.has(c.categoriaPadreId)) continue
    resultado.push(c, ...lista.filter((h) => h.categoriaPadreId === c.id))
  }
  return resultado
}

// Nombre de la categoría principal de una subcategoría («otra categoría» si no está en la lista, como hoy)
export function nombrePadre(categoria: CategoriaAdmin, lista: CategoriaAdmin[]): string | null {
  if (categoria.categoriaPadreId === null) return null
  return lista.find((c) => c.id === categoria.categoriaPadreId)?.nombre ?? 'otra categoría'
}
