export interface DetallePedidoProducto {
  id: number
  nombre: string
  imagen: string | null
}

export interface DetallePedido {
  id: number
  cantidad: number
  precio: string
  productoId: number
  Producto: DetallePedidoProducto
}

export interface Order {
  id: number
  usuarioId: number
  fecha: string
  total: string
  estado: string
  DetallePedidos: DetallePedido[]
}