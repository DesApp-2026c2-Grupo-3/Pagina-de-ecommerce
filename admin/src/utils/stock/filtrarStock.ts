import type { ItemStock } from '../../types/stock.types'
import { estadoInsumo } from './estadoInsumo'

export type FiltroEstadoStock = 'todos' | 'bajo' | 'sin' | 'deshabilitado'

export function esFiltroEstadoStock(valor: unknown): valor is FiltroEstadoStock {
  return valor === 'todos' || valor === 'bajo' || valor === 'sin' || valor === 'deshabilitado'
}

interface OpcionesFiltrarStock {
  items: ItemStock[]
  busqueda: string
  filtroEstado: string
  // Insumo que abrió un aviso de stock bajo: se muestra solo ese
  objetivoId: number | null
}

function coincideNombre(item: ItemStock, busqueda: string): boolean {
  return item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
}

function coincideEstado(item: ItemStock, filtroEstado: string): boolean {
  return filtroEstado === 'todos' || estadoInsumo(item) === filtroEstado
}

export function filtrarStock({ items, busqueda, filtroEstado, objetivoId }: OpcionesFiltrarStock) {
  return items.filter((item) => {
    if (objetivoId !== null && item.id !== objetivoId) return false
    return coincideNombre(item, busqueda) && coincideEstado(item, filtroEstado)
  })
}

// Contadores del filtro de estado, sobre lo que coincide con la búsqueda
export function contarPorEstadoStock(items: ItemStock[], busqueda: string): Record<FiltroEstadoStock, number> {
  const conteo: Record<FiltroEstadoStock, number> = { todos: 0, bajo: 0, sin: 0, deshabilitado: 0 }
  for (const item of items) {
    if (!coincideNombre(item, busqueda)) continue
    conteo.todos += 1
    const estado = estadoInsumo(item)
    if (estado !== 'normal') conteo[estado] += 1
  }
  return conteo
}
