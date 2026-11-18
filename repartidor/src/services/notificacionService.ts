import { apiFetch } from './httpClient'
import { mapearNotificacion } from '../notificaciones/mapearNotificacion'
import type {
  PaginaNotificaciones,
  PaginaNotificacionesRemota,
} from '../types/notificacion.types'
import type { Notificacion } from '../notificaciones/catalogo'

const BASE = '/repartidor/notificaciones'

export function normalizarCursorNotificaciones(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor : null
}

export async function listarNotificaciones({
  limite,
  antesDe,
}: { limite: number; antesDe?: string }): Promise<PaginaNotificaciones> {
  const params = new URLSearchParams({ limite: String(limite) })
  if (antesDe) params.set('antesDe', antesDe)

  const pagina = await apiFetch<PaginaNotificacionesRemota>(`${BASE}?${params.toString()}`)
  const items = Array.isArray(pagina?.items)
    ? pagina.items
        .map(mapearNotificacion)
        .filter((notificacion): notificacion is Notificacion => notificacion !== null)
    : []

  return {
    items,
    siguienteCursor: normalizarCursorNotificaciones(pagina?.siguienteCursor),
  }
}

export async function contarNotificacionesNoLeidas(): Promise<number> {
  const respuesta = await apiFetch<{ cantidad: unknown }>(`${BASE}/no-leidas/count`)
  const cantidad = Number(respuesta?.cantidad)
  return Number.isInteger(cantidad) && cantidad >= 0 ? cantidad : 0
}

export const marcarNotificacionLeida = (id: number) =>
  apiFetch<{ ok: boolean; leidaEn: string }>(`${BASE}/${id}/leida`, { method: 'PATCH' })

export const marcarTodasNotificacionesLeidas = () =>
  apiFetch<{ ok: boolean; leidaEn: string }>(`${BASE}/leer-todas`, { method: 'PATCH' })
