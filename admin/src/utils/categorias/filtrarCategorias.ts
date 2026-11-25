import type { CategoriaAdmin } from '../../types/categoria.types'

// Sin «Todas»: siempre se ve una de las dos listas (plan de Categorías, D-C5: arranca en Habilitadas)
export type FiltroEstadoCategoria = 'habilitadas' | 'deshabilitadas'

export function esFiltroEstadoCategoria(valor: unknown): valor is FiltroEstadoCategoria {
  return valor === 'habilitadas' || valor === 'deshabilitadas'
}

export interface FiltrosCategorias {
  busqueda: string
  estado: FiltroEstadoCategoria
}

function coincideBusqueda(c: CategoriaAdmin, busqueda: string): boolean {
  return c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
}

// Recibe la lista ya en orden jerárquico y conserva ese orden
export function filtrarCategorias(lista: CategoriaAdmin[], { busqueda, estado }: FiltrosCategorias): CategoriaAdmin[] {
  return lista.filter((c) => coincideBusqueda(c, busqueda) && c.activo === (estado === 'habilitadas'))
}

// Contadores de los botones, sobre la búsqueda elegida
export function contarPorEstado(lista: CategoriaAdmin[], busqueda: string): Record<FiltroEstadoCategoria, number> {
  const conteo: Record<FiltroEstadoCategoria, number> = { habilitadas: 0, deshabilitadas: 0 }
  for (const c of lista) {
    if (!coincideBusqueda(c, busqueda)) continue
    if (c.activo) conteo.habilitadas += 1
    else conteo.deshabilitadas += 1
  }
  return conteo
}

// «12 categorías · 3 deshabilitadas», sobre el total (sin filtros), como el resumen de hoy
export function resumenCategorias(lista: CategoriaAdmin[]): string {
  const deshabilitadas = lista.filter((c) => !c.activo).length
  return `${lista.length} ${lista.length === 1 ? 'categoría' : 'categorías'} · ${deshabilitadas} ${
    deshabilitadas === 1 ? 'deshabilitada' : 'deshabilitadas'
  }`
}
