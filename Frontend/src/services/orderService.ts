import { httpClient } from './httpClient'
import type { CartItem } from '../types/cart'
import type { Order } from '../types/order'

export const createOrder = async (
  usuarioId: number,
  items: CartItem[],
  direccionId: number,
  sucursalId: number,
): Promise<Order> => {
  
  const productos = items.map((item) => ({
    productoId: item.product.id,
    cantidad: item.quantity,
    personalizaciones: item.personalizaciones ?? [],
    ...(item.tamanioId ? { tamanioId: item.tamanioId } : {}),
    ...(item.combo?.length ? { elecciones: item.combo } : {}),
  }))

  return httpClient<Order>('/pedido', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, productos, direccionId, sucursalId }),
  })
}

export const getHistorialPedidos = async (usuarioId: number): Promise<Order[]> => {
  return httpClient<Order[]>(`/pedido/usuario/${usuarioId}`)
}