// Un producto del pedido que el cliente puede calificar (las salsas gratuitas no vienen)
export interface ItemCalificable {
  productoId: number
  nombre: string
  imagen: string | null
}

// El pedido que le toca calificar al cliente (GET /calificaciones/pendiente)
export interface CalificacionPendiente {
  pedidoId: number
  fecha: string
  entregadoEn: string
  total: number
  sucursal: { id: number; nombre: string } | null
  items: ItemCalificable[]
}

// Lo que el cliente dejó sobre un producto: estrellas (0 = sin estrellas) y comentario
export interface RespuestaItem {
  puntaje: number
  comentario: string
}
