import type { RespuestaNotificaciones } from '../types/notificacion.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/notificaciones`

export async function obtenerNotificaciones() {
  return apiFetch<RespuestaNotificaciones>(API, { mensajePorDefecto: 'Error al obtener las notificaciones' })
}

export async function marcarNotificacionLeida(id: number) {
  return apiFetch<{ ok: boolean }>(`${API}/${id}/leida`, {
    method: 'PATCH',
    mensajePorDefecto: 'Error al marcar la notificación',
  })
}

export async function marcarTodasLeidas() {
  return apiFetch<{ marcadas: number }>(`${API}/leidas`, {
    method: 'PATCH',
    mensajePorDefecto: 'Error al marcar las notificaciones',
  })
}
