
export type EstadoPedido = 'pendiente' | 'en-viaje' | 'entregado'

export interface Pedido {
  id: number
  direccion: string
  cantidadProductos: number
  estado: EstadoPedido
}
