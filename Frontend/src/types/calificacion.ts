// El pedido que le toca calificar al cliente (GET /calificaciones/pendiente)
export interface CalificacionPendiente {
  pedidoId: number
  fecha: string
  entregadoEn: string
  total: number
  sucursal: { id: number; nombre: string } | null
  productos: string[]
}
