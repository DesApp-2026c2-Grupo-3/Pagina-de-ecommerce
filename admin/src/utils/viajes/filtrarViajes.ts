import type { ContadoresViaje, FiltroEstadoViaje, Viaje } from '../../types/viaje.types'
import { ESTADOS_VIAJE, normalizarEstadoViaje } from './estadoViaje'
import { nombreRepartidor } from './resumenViaje'

// Busca por repartidor, número de viaje, número de pedido o cliente de alguno de sus pedidos
export function coincideBusquedaViaje(viaje: Viaje, busqueda: string): boolean {
  const termino = busqueda.trim().toLowerCase()
  if (termino === '') return true
  if (nombreRepartidor(viaje).toLowerCase().includes(termino)) return true
  if (String(viaje.id).includes(termino)) return true
  return (viaje.Pedidos ?? []).some((pedido) => {
    const cliente = `${pedido.Usuario?.nombre ?? ''} ${pedido.Usuario?.apellido ?? ''}`.toLowerCase()
    return String(pedido.id).includes(termino) || cliente.includes(termino)
  })
}

export function coincideEstadoViaje(viaje: Viaje, estado: FiltroEstadoViaje): boolean {
  return estado === 'todos' || normalizarEstadoViaje(viaje.estado) === estado
}

export function filtrarViajes(
  viajes: Viaje[],
  filtros: { busqueda: string; estado: FiltroEstadoViaje },
): Viaje[] {
  return viajes.filter(
    (viaje) => coincideBusquedaViaje(viaje, filtros.busqueda) && coincideEstadoViaje(viaje, filtros.estado),
  )
}

// Contadores del filtro, sobre la búsqueda (no sobre el estado elegido)
export function contarPorEstadoViaje(viajes: Viaje[], busqueda = ''): ContadoresViaje {
  const contadores = { todos: 0 } as ContadoresViaje
  for (const estado of ESTADOS_VIAJE) contadores[estado.valor] = 0

  for (const viaje of viajes) {
    if (!coincideBusquedaViaje(viaje, busqueda)) continue
    contadores.todos += 1
    const estado = normalizarEstadoViaje(viaje.estado) as keyof ContadoresViaje
    if (estado in contadores) contadores[estado] += 1
  }
  return contadores
}
