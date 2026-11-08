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
  direccionId: number | null
  fecha: string
  total: string
  estado: string
  DetallePedidos: DetallePedido[]
  Sucursal:{id: number, nombre:string}
  observaciones?: string | null;
  historialDeTiemposPedidos?: { estado: string; fecha: string }[]
  /** null si todavía no se calificó (lo manda el backend desde la Etapa 1) */
  calificacion?: { id: number } | null
}