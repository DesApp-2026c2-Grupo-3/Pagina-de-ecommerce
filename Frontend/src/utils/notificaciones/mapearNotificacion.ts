import type { NotificacionCliente } from '../../types/notificacion.types'
import { fabricaNotificacionesCliente } from './fabricaNotificaciones'
import { fechaIso } from './validaciones'

export function mapearNotificacion(
  payload: unknown,
): NotificacionCliente | null {
  const notificacion = fabricaNotificacionesCliente.crear(payload)
  if (!notificacion) return null

  const ocurridoEn = fechaIso(notificacion.ocurridoEn)
  if (!ocurridoEn) return null

  if (notificacion.leidaEn === null) {
    return { ...notificacion, ocurridoEn }
  }

  const leidaEn = fechaIso(notificacion.leidaEn)
  if (!leidaEn) return null

  return { ...notificacion, ocurridoEn, leidaEn }
}

export function mapearNotificaciones(
  payloads: unknown[],
): NotificacionCliente[] {
  const notificaciones: NotificacionCliente[] = []

  for (const payload of payloads) {
    const notificacion = mapearNotificacion(payload)
    if (notificacion) notificaciones.push(notificacion)
  }

  return notificaciones
}
