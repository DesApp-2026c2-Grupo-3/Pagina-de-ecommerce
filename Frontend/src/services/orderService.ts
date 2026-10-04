import { httpClient } from './httpClient'
import type { CartItem } from '../types/cart'
import type { Order } from '../types/order'
import type { ComboElecciones, IngredientePersonalizacion } from '../types/cart'

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


// Una línea de un pedido viejo, reconstruida con los precios de hoy
export interface LineaRepetida {
  productoId: number
  cantidad: number
  tamanioId: number | null
  personalizaciones: IngredientePersonalizacion[]
  combo: ComboElecciones
  unitPrice: number
  precioAnterior: number
  selectedOptions: string[]
  aviso: string | null
}

export interface ResultadoRepetir {
  disponibles: LineaRepetida[]
  noDisponibles: { nombre: string; cantidad: number; motivo: string }[]
}

export const getRepetirPedido = (pedidoId: number, usuarioId: number, sucursalId: number) =>
  httpClient<ResultadoRepetir>(`/pedido/${pedidoId}/repetir?usuarioId=${usuarioId}&sucursalId=${sucursalId}`)