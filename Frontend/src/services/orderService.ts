import { httpClient } from './httpClient'
import type { CartItem } from '../types/cart'

interface PedidoBackend {
  id: number
  usuarioId: number
  fecha: string
  total: number
}

export const createOrder = async (
  usuarioId: number,
  items: CartItem[],
): Promise<PedidoBackend> => {
  const productos = items.map((item) => ({
    productoId: item.product.id,
    cantidad: item.quantity,
  }))

  return httpClient<PedidoBackend>('/pedido', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, productos }),
  })
}