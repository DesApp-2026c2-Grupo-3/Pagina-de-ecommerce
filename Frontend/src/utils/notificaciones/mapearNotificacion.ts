import type { NotificacionCliente } from '../../types/notificacion.types'
import { fabricaNotificacionesCliente } from './fabricaNotificaciones'

// Payload del servidor (HTTP o socket) → aviso del cliente, o null si no es válido
export function mapearNotificacion(payload: unknown): NotificacionCliente | null {
  return fabricaNotificacionesCliente.crear(payload)
}
