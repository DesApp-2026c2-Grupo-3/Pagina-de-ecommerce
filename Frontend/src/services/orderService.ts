import { httpClient } from './httpClient'
import type { CartItem } from '../types/cart'
import type { Order } from '../types/order'

export const createOrder = async (usuarioId: number, items: CartItem[]): Promise<Order> => {
  const productos = items.map((item) => ({
    productoId: item.product.id,
    cantidad: item.quantity,
  }))

  return httpClient<Order>('/pedido', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, productos }),
  })
}

export const getHistorialPedidos = async (usuarioId: number): Promise<Order[]> => {
  return httpClient<Order[]>(`/pedido/usuario/${usuarioId}`)
}