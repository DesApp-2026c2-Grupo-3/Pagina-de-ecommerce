import { apiFetch, API_URL } from './httpClient'
import type { CalificacionAdmin, EstadoCalificacion } from '../types/calificacion.types'

const API = `${API_URL}/admin/calificaciones`

// El master ve todas las sucursales; el admin de sucursal, solo la suya (lo decide el backend)
export async function obtenerCalificaciones(estado: EstadoCalificacion) {
  return apiFetch<CalificacionAdmin[]>(`${API}?estado=${estado}`, {
    mensajePorDefecto: 'Error al obtener las calificaciones',
  })
}

export async function cambiarEstadoCalificacion(id: number, estado: 'APROBADA' | 'OCULTA') {
  return apiFetch(`${API}/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
    mensajePorDefecto: 'Error al cambiar el estado',
  })
}