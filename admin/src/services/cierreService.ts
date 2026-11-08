import type { CierreActivo, EstadoCierre } from '../types/cierre.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/cierres`

export async function obtenerEstadoCierre(sucursalId: number) {
  return apiFetch<EstadoCierre>(`${API}/sucursal/${sucursalId}`, {
    mensajePorDefecto: 'Error al obtener el estado de la sucursal',
  })
}

export async function cerrarSucursal(sucursalId: number, motivo: string) {
  return apiFetch<{ id: number; cerrada: boolean }>(`${API}/sucursal/${sucursalId}/cerrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
    mensajePorDefecto: 'Error al cerrar la sucursal',
  })
}

export async function reabrirSucursal(sucursalId: number) {
  return apiFetch<{ cerrada: boolean }>(`${API}/sucursal/${sucursalId}/reabrir`, {
    method: 'POST',
    mensajePorDefecto: 'Error al reabrir la sucursal',
  })
}

export async function obtenerCierresActivos() {
  return apiFetch<CierreActivo[]>(API, { mensajePorDefecto: 'Error al obtener los cierres' })
}
