import type { Viaje } from '../types/viaje.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/viajes`

export async function obtenerViajesPorSucursal(sucursalId: number): Promise<Viaje[]> {
  return apiFetch(`${API}/sucursal/${sucursalId}`, {
    mensajePorDefecto: 'Error al obtener los viajes',
  })
}