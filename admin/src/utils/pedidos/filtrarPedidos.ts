import type {
  ContadoresEtapa,
  FiltroEtapa,
  PedidoFila,
} from '../../types/pedido.types'
import { ETAPAS } from '../../types/pedido.types'
import { nombreCliente } from './resumenPedido'

export function esFiltroEtapa(valor: unknown): valor is FiltroEtapa {
  return (
    valor === 'todas' ||
    (typeof valor === 'string' && (ETAPAS as readonly string[]).includes(valor))
  )
}

// Busca por nombre/apellido del cliente o por número de pedido
export function coincideBusqueda(pedido: PedidoFila, busqueda: string): boolean {
  const termino = busqueda.trim().toLowerCase()
  if (termino === '') return true

  const cliente = pedido.Usuario ? nombreCliente(pedido).toLowerCase() : ''
  return cliente.includes(termino) || String(pedido.id).includes(termino)
}

export function coincideEtapa(pedido: PedidoFila, etapa: FiltroEtapa): boolean {
  return etapa === 'todas' || pedido.estado === etapa
}

export function filtrarPedidos(
  pedidos: PedidoFila[],
  filtros: { busqueda: string; etapa: FiltroEtapa },
): PedidoFila[] {
  return pedidos.filter(
    (pedido) =>
      coincideBusqueda(pedido, filtros.busqueda) &&
      coincideEtapa(pedido, filtros.etapa),
  )
}

// Contadores de los botones/opciones de etapa. Se calculan sobre la búsqueda
// (no sobre la etapa elegida), así cada opción dice cuántos verías al elegirla.
export function contarPorEtapa(
  pedidos: PedidoFila[],
  busqueda = '',
): ContadoresEtapa {
  const contadores = { todas: 0 } as ContadoresEtapa
  for (const etapa of ETAPAS) contadores[etapa] = 0

  for (const pedido of pedidos) {
    if (!coincideBusqueda(pedido, busqueda)) continue
    contadores.todas += 1
    if (esFiltroEtapa(pedido.estado) && pedido.estado !== 'todas') {
      contadores[pedido.estado] += 1
    }
  }
  return contadores
}
