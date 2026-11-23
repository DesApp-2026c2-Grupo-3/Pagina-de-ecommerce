import type { Category, ProductoBackend } from '../types/product'

// Cómo se arma el menú del catálogo: sale directo del árbol de categorías del backend.
//  - Cada categoría principal (sin padre) es un botón del menú, en el orden que define el admin.
//  - Sus subcategorías son el submenú. Si no tiene, no hay submenú (Bebidas, Postres).
//  - "Todos" no es una categoría: los filtros lo agregan siempre al final.

export interface SubgrupoCatalogo {
  slug: string
  categoria: Category
}

export interface GrupoCatalogo {
  slug: string
  categoria: Category
  /** Vacío = sin submenú */
  subgrupos: SubgrupoCatalogo[]
}

// "Menú Café" → "menu cafe"
export function normalizarNombre(nombre: string) {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

// "Hamburguesas de pollo" → "hamburguesas-de-pollo" (es lo que va en la dirección: ?grupo=...&sub=...)
export const aSlug = (nombre: string) =>
  normalizarNombre(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Los grupos del menú: cada categoría principal con sus hijas (el backend ya las manda ordenadas) */
export function armarGrupos(categorias: Category[]): GrupoCatalogo[] {
  return categorias
    .filter((c) => c.categoriaPadreId == null)
    .map((principal) => ({
      slug: aSlug(principal.nombre),
      categoria: principal,
      subgrupos: categorias
        .filter((c) => c.categoriaPadreId === principal.id)
        .map((hija) => ({ slug: aSlug(hija.nombre), categoria: hija })),
    }))
}

/** true si el producto está en el grupo: en la categoría principal o en alguna de sus hijas */
export function perteneceAlGrupo(grupo: GrupoCatalogo, producto: ProductoBackend) {
  return (
    producto.categoriaId === grupo.categoria.id ||
    grupo.subgrupos.some((s) => s.categoria.id === producto.categoriaId)
  )
}

/** Grupo (y subgrupo, si es una hija) de una categoría. Sirve para abrir el catálogo desde el Home (?categoria=3) */
export function ubicarCategoria(
  grupos: GrupoCatalogo[],
  categoriaId: number,
): { grupo: GrupoCatalogo; subgrupo?: SubgrupoCatalogo } | undefined {
  for (const grupo of grupos) {
    if (grupo.categoria.id === categoriaId) return { grupo }
    const subgrupo = grupo.subgrupos.find((s) => s.categoria.id === categoriaId)
    if (subgrupo) return { grupo, subgrupo }
  }
  return undefined
}
