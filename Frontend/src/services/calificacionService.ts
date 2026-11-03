import { httpClient } from './httpClient'
import type { CalificacionPendiente } from '../types/calificacion'

// El último pedido entregado que todavía no calificó (o null si no hay nada para calificar)
export const getCalificacionPendiente = async (usuarioId: number): Promise<CalificacionPendiente | null> => {
  const { pendiente } = await httpClient<{ pendiente: CalificacionPendiente | null }>(
    `/calificaciones/pendiente?usuarioId=${usuarioId}`,
  )
  return pendiente
}

// Estrellas obligatorias; el comentario es opcional
export const calificarPedido = (usuarioId: number, pedidoId: number, puntaje: number, comentario: string) =>
  httpClient<{ mensaje: string }>('/calificaciones', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, pedidoId, puntaje, comentario: comentario.trim() }),
  })
