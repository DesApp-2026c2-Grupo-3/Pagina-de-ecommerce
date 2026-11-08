import { httpClient } from './httpClient'
import type { CalificacionPendiente, RespuestaItem } from '../types/calificacion'

// El último pedido entregado que todavía no calificó (o null si no hay nada para calificar)
export const getCalificacionPendiente = async (usuarioId: number): Promise<CalificacionPendiente | null> => {
  const { pendiente } = await httpClient<{ pendiente: CalificacionPendiente | null }>(
    `/calificaciones/pendiente?usuarioId=${usuarioId}`,
  )
  return pendiente
}

// Se califica el pedido de una vez, producto por producto. Los productos sin estrellas ni comentario no se mandan:
// hace falta al menos uno con algo (el backend lo valida igual).
export const calificarPedido = (usuarioId: number, pedidoId: number, respuestas: Record<number, RespuestaItem>) => {
  const items = Object.entries(respuestas)
    .map(([productoId, { puntaje, comentario }]) => ({
      productoId: Number(productoId),
      puntaje: puntaje > 0 ? puntaje : null,
      comentario: comentario.trim(),
    }))
    .filter((item) => item.puntaje !== null || item.comentario !== '')

  return httpClient<{ mensaje: string }>('/calificaciones', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, pedidoId, items }),
  })
}
