import type { GeoResultado, GeoSugerencia } from '../types/geo.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/geo`

export function autocompletarDireccion(q: string, sessionToken: string) {
  const params = new URLSearchParams({ q, sessionToken })
  return apiFetch<GeoSugerencia[]>(`${API}/autocompletar?${params}`, {
    mensajePorDefecto: 'Error al buscar la dirección',
  })
}

export function detalleDireccion(placeId: string, sessionToken: string) {
  const params = new URLSearchParams({ sessionToken })
  return apiFetch<GeoResultado>(
    `${API}/detalle/${encodeURIComponent(placeId)}?${params}`,
    { mensajePorDefecto: 'No se pudo cargar la dirección' },
  )
}

export function direccionDesdeCoordenadas(lat: number, lon: number) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  return apiFetch<GeoResultado>(`${API}/reverse?${params}`, {
    mensajePorDefecto: 'No pudimos obtener la dirección',
  })
}
