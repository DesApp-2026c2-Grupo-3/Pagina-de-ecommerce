import { apiFetch } from './httpClient'
import type {
  Pedido,
  RespuestaEntregarPedido,
  RespuestaRetirarPedido,
} from '../types/pedido.types'

export const obtenerPedidosDisponibles = () =>
  apiFetch<Pedido[]>('/repartidor/pedidos/disponibles')

// D-07: retirar del local no cambia el estado; el pedido sale "En camino" al iniciar el viaje
export const retirarPedido = (pedidoId: number) =>
  apiFetch<RespuestaRetirarPedido>(`/repartidor/pedidos/${pedidoId}/retirar`, {
    method: 'PATCH',
  })

export const entregarPedido = (pedidoId: number) =>
  apiFetch<RespuestaEntregarPedido>(`/repartidor/pedidos/${pedidoId}/entregar`, {
    method: 'PATCH',
  })
