import type { EventoNotificacionLeida } from '../../types/notificacion.types'
import {
  esRegistro,
  fechaIso,
  numeroPositivo,
} from './validaciones'

export function mapearEventoLeida(
  payload: unknown,
): EventoNotificacionLeida | null {
  if (!esRegistro(payload)) return null

  const leidaEn = fechaIso(payload.leidaEn)
  if (!leidaEn) return null

  if (payload.todas === true) {
    return { todas: true, leidaEn }
  }

  const notificacionId = numeroPositivo(payload.notificacionId)
  if (notificacionId === null) return null

  return { notificacionId, leidaEn }
}
