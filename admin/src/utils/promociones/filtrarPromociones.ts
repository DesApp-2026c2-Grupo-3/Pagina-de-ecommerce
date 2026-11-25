import { DIAS } from '../../config/promociones'
import type { PromocionAdmin, TipoPromo } from '../../types/promocion.types'

export type FiltroTipoPromo = 'todos' | TipoPromo
export type FiltroEstadoPromo = 'todos' | 'activas' | 'deshabilitadas'

export function esFiltroTipoPromo(valor: unknown): valor is FiltroTipoPromo {
  return valor === 'todos' || valor === 'SEMANA' || valor === 'REGALO' || valor === 'DIA'
}

export function esFiltroEstadoPromo(valor: unknown): valor is FiltroEstadoPromo {
  return valor === 'todos' || valor === 'activas' || valor === 'deshabilitadas'
}

export interface FiltrosPromociones {
  busqueda: string
  tipo: FiltroTipoPromo
  estado: FiltroEstadoPromo
}

const ORDEN_TIPO: Record<TipoPromo, number> = { SEMANA: 0, REGALO: 1, DIA: 2 }

// Posición del primer día de la promo en la semana (lunes primero), para ordenar la lista
const posicionDelDia = (p: PromocionAdmin) =>
  p.dias.length === 0 ? 0 : Math.min(...p.dias.map((d) => DIAS.findIndex((x) => x.valor === d)))

// Misma lógica que tenía la página: por título o por el nombre de algún producto
function coincideBusqueda(p: PromocionAdmin, busqueda: string): boolean {
  const texto = busqueda.trim().toLowerCase()
  if (!texto) return true
  return p.titulo.toLowerCase().includes(texto) || p.items.some((i) => i.nombre?.toLowerCase().includes(texto))
}

const coincideTipo = (p: PromocionAdmin, tipo: FiltroTipoPromo) => tipo === 'todos' || p.tipo === tipo

// «Activas» usa solo `activo` (incluye las ocultas por un producto eliminado), como hoy
const coincideEstado = (p: PromocionAdmin, estado: FiltroEstadoPromo) =>
  estado === 'todos' || (estado === 'activas' ? p.activo : !p.activo)

// Filtra y ordena: por tipo (semana, regalo, día), por el primer día y por id (movido tal cual)
export function filtrarPromociones(lista: PromocionAdmin[], f: FiltrosPromociones): PromocionAdmin[] {
  return lista
    .filter((p) => coincideTipo(p, f.tipo) && coincideEstado(p, f.estado) && coincideBusqueda(p, f.busqueda))
    .sort((a, b) => ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo] || posicionDelDia(a) - posicionDelDia(b) || a.id - b.id)
}

// Contadores del menú de tipo, sobre la búsqueda y el estado elegidos
export function contarPorTipo(lista: PromocionAdmin[], f: Omit<FiltrosPromociones, 'tipo'>): Record<FiltroTipoPromo, number> {
  const conteo: Record<FiltroTipoPromo, number> = { todos: 0, SEMANA: 0, REGALO: 0, DIA: 0 }
  for (const p of lista) {
    if (!coincideEstado(p, f.estado) || !coincideBusqueda(p, f.busqueda)) continue
    conteo.todos += 1
    conteo[p.tipo] += 1
  }
  return conteo
}

// Contadores del menú de estado, sobre la búsqueda y el tipo elegidos
export function contarPorEstadoPromo(
  lista: PromocionAdmin[],
  f: Omit<FiltrosPromociones, 'estado'>,
): Record<FiltroEstadoPromo, number> {
  const conteo: Record<FiltroEstadoPromo, number> = { todos: 0, activas: 0, deshabilitadas: 0 }
  for (const p of lista) {
    if (!coincideTipo(p, f.tipo) || !coincideBusqueda(p, f.busqueda)) continue
    conteo.todos += 1
    if (p.activo) conteo.activas += 1
    else conteo.deshabilitadas += 1
  }
  return conteo
}
