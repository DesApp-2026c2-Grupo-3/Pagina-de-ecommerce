import type {
  NotificacionCliente,
  PaginaNotificacionesCliente,
  PaginaNotificacionesRemota,
  RespuestaMarcarLeida,
  RespuestaMarcarTodas,
} from '../types/notificacion.types'
import { mapearNotificacion } from '../utils/notificaciones/mapearNotificacion'
import { normalizarCursor } from '../utils/notificaciones/normalizarCursor'
import {
  construirUrlMarcarLeida,
  construirUrlNotificaciones,
  RUTA_CONTADOR_NO_LEIDAS,
  RUTA_LEER_TODAS,
} from '../utils/notificaciones/urlNotificaciones'
import { fechaIso, numeroNoNegativo } from '../utils/notificaciones/validaciones'
import { httpClient } from './httpClient'

export const LIMITE_INICIAL = 8
export const LIMITE_VER_MAS = 5

interface OpcionesListarNotificacionesCliente {
  limite?: number
  antesDe?: string | null
}

export async function listarNotificacionesCliente({
  limite = LIMITE_INICIAL,
  antesDe = null,
}: OpcionesListarNotificacionesCliente = {}): Promise<PaginaNotificacionesCliente> {
  const respuesta = await httpClient<PaginaNotificacionesRemota>(
    construirUrlNotificaciones({ limite, antesDe }),
  )

  if (!Array.isArray(respuesta?.items)) {
    throw new Error('El servidor devolvió una lista de notificaciones inválida')
  }

  const siguienteCursor = normalizarCursor(respuesta.siguienteCursor)
  if (respuesta.siguienteCursor != null && siguienteCursor === null) {
    throw new Error('El servidor devolvió un cursor inválido')
  }

  const items = respuesta.items
    .map((payload) => mapearNotificacion(payload))
    .filter((item): item is NotificacionCliente => item !== null)

  return { items, siguienteCursor }
}

export async function contarNotificacionesNoLeidasCliente(): Promise<number> {
  const respuesta = await httpClient<{ cantidad?: unknown }>(
    RUTA_CONTADOR_NO_LEIDAS,
  )
  const cantidad = numeroNoNegativo(respuesta?.cantidad)

  if (cantidad === null) {
    throw new Error('El servidor devolvió un contador inválido')
  }

  return cantidad
}

export async function marcarNotificacionLeidaCliente(
  id: number,
): Promise<RespuestaMarcarLeida> {
  const respuesta = await httpClient<RespuestaMarcarLeida>(
    construirUrlMarcarLeida(id),
    { method: 'PATCH' },
  )
  const leidaEn = fechaIso(respuesta?.leidaEn)

  if (respuesta?.ok !== true || leidaEn === null) {
    throw new Error('El servidor devolvió una confirmación inválida')
  }

  return { ok: true, notificacionId: id, leidaEn }
}

export async function marcarTodasNotificacionesLeidasCliente(): Promise<RespuestaMarcarTodas> {
  const respuesta = await httpClient<RespuestaMarcarTodas>(RUTA_LEER_TODAS, {
    method: 'PATCH',
  })
  const cantidad = numeroNoNegativo(respuesta?.cantidad)
  const leidaEn = fechaIso(respuesta?.leidaEn)

  if (respuesta?.ok !== true || cantidad === null || leidaEn === null) {
    throw new Error('El servidor devolvió una confirmación inválida')
  }

  return { ok: true, cantidad, leidaEn }
}
