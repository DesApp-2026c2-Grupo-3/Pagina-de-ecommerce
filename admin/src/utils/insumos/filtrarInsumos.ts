import type { Insumo } from '../../types/insumo.types'

// Dos botones fijos, sin «Todos» (plan de Insumos v3, D-I1). Arranca en Habilitados.
export type FiltroEstadoInsumo = 'habilitados' | 'deshabilitados'

export function esFiltroEstadoInsumo(valor: unknown): valor is FiltroEstadoInsumo {
  return valor === 'habilitados' || valor === 'deshabilitados'
}

export interface FiltrosInsumos {
  busqueda: string
  estado: FiltroEstadoInsumo
}

function coincideBusqueda(i: Insumo, busqueda: string): boolean {
  return i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
}

export function filtrarInsumos(lista: Insumo[], { busqueda, estado }: FiltrosInsumos): Insumo[] {
  return lista.filter((i) => coincideBusqueda(i, busqueda) && i.activo === (estado === 'habilitados'))
}

// Contadores de los botones, sobre la búsqueda elegida
export function contarPorEstadoInsumo(lista: Insumo[], busqueda: string): Record<FiltroEstadoInsumo, number> {
  const conteo: Record<FiltroEstadoInsumo, number> = { habilitados: 0, deshabilitados: 0 }
  for (const i of lista) {
    if (!coincideBusqueda(i, busqueda)) continue
    if (i.activo) conteo.habilitados += 1
    else conteo.deshabilitados += 1
  }
  return conteo
}

// Mismo criterio que hoy para el mensaje de lista vacía
export function mensajeSinInsumos(total: number, busqueda: string): string {
  if (total === 0) return 'No hay insumos registrados.'
  if (!busqueda.trim()) return 'No hay insumos para este filtro.'
  return 'No se encontraron insumos con los criterios seleccionados.'
}
