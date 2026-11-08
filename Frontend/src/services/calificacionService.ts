import { httpClient } from './httpClient'
import type { CalificacionPublica } from '../types/calificacion'

// Las últimas calificaciones aprobadas, para el inicio
export const getCalificacionesRecientes = () =>
  httpClient<CalificacionPublica[]>('/calificaciones/recientes')

// Estrellas obligatorias; el comentario es opcional
export const calificarPedido = (usuarioId: number, pedidoId: number, puntaje: number, comentario: string) =>
  httpClient<{ mensaje: string }>('/calificaciones', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, pedidoId, puntaje, comentario: comentario.trim() }),
  })