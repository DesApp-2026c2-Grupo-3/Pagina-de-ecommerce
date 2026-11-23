import type {
  PaginaNotificaciones,
  PaginaNotificacionesRemota,
} from '../types/notificacion.types'
import { mapearNotificacion } from '../utils/notificaciones/mapearNotificacion'
import { apiFetch, API_URL } from './httpClient'

interface RespuestaMarcarTodas {
  leidaEn?: unknown
}

interface OpcionesListarNotificaciones {
  limite: number
  antesDe?: string | null
}

export function normalizarCursorNotificaciones(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const cursor = valor.trim()
  if (!cursor || cursor === 'null' || cursor === 'undefined') return null

  return cursor
}

export async function listarNotificaciones({
  limite,
  antesDe,
}: OpcionesListarNotificaciones): Promise<PaginaNotificaciones> {
  const parametros = new URLSearchParams({ limite: String(limite) })
  const cursor = normalizarCursorNotificaciones(antesDe)
  if (cursor) parametros.set('antesDe', cursor)

  const respuesta = await apiFetch<PaginaNotificacionesRemota>(
    `${API_URL}/notificaciones?${parametros.toString()}`,
  )

  if (!Array.isArray(respuesta?.items)) {
    throw new Error('El servidor devolvió una lista de notificaciones inválida')
  }

  if (
    respuesta.siguienteCursor !== null &&
    typeof respuesta.siguienteCursor !== 'string'
  ) {
    throw new Error('El servidor devolvió un cursor inválido')
  }

  return {
    items: respuesta.items
      .map(mapearNotificacion)
      .filter((item) => item !== null),
    siguienteCursor: normalizarCursorNotificaciones(respuesta.siguienteCursor),
  }
}

export async function contarNotificacionesNoLeidas(): Promise<number> {
  const respuesta = await apiFetch<{ cantidad?: unknown }>(
    `${API_URL}/notificaciones/no-leidas/count`,
  )
  const cantidad = Number(respuesta?.cantidad)

  if (!Number.isFinite(cantidad) || cantidad < 0) {
    throw new Error('El servidor devolvió un contador inválido')
  }

  return cantidad
}

export async function marcarNotificacionLeida(id: number): Promise<void> {
  await apiFetch(`${API_URL}/notificaciones/${id}/leida`, {
    method: 'PATCH',
  })
}

export async function marcarTodasNotificacionesLeidas(): Promise<RespuestaMarcarTodas> {
  return apiFetch<RespuestaMarcarTodas>(
    `${API_URL}/notificaciones/leer-todas`,
    { method: 'PATCH' },
  )
}
