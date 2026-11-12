import { apiFetch } from './httpClient'
import type { Pedido } from '../types/pedido.types'

export const obtenerPedidosDisponibles = async (): Promise<Pedido[]> => {
  return apiFetch<Pedido[]>('/repartidor/pedidos/disponibles')
}

export const actualizarEstadoPedido = ( pedidoId: number, estado: 'En camino' | 'Entregado' ) => {
  return apiFetch<{
    mensaje: string
    pedido: {
      id: number
      estado: string
    }
    viajeFinalizado: boolean
  }>(`/repartidor/pedidos/${pedidoId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado }),
  })
}