import type { ProductoSucursal, SuspensionRegistrada } from '../types/suspension.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/suspensiones`
const JSON_HEADERS = { 'Content-Type': 'application/json' }

export async function obtenerProductosDeSucursal(sucursalId: number) {
  return apiFetch<ProductoSucursal[]>(`${API}/sucursal/${sucursalId}/productos`, {
    mensajePorDefecto: 'Error al obtener los productos de la sucursal',
  })
}

export async function suspenderProductos(sucursalId: number, productoIds: number[], motivo: string) {
  return apiFetch<{ suspendidos: number; yaSuspendidos: number }>(`${API}/sucursal/${sucursalId}/suspender`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ productoIds, motivo }),
    mensajePorDefecto: 'Error al suspender los productos',
  })
}

export async function rehabilitarProductos(sucursalId: number, productoIds: number[]) {
  return apiFetch<{ rehabilitados: number; noRehabilitados: number }>(`${API}/sucursal/${sucursalId}/rehabilitar`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ productoIds }),
    mensajePorDefecto: 'Error al rehabilitar los productos',
  })
}

export async function obtenerSuspensiones(filtros: { estado: 'activas' | 'historial'; sucursalId?: number }) {
  const params = new URLSearchParams({ estado: filtros.estado })
  if (filtros.sucursalId) params.set('sucursalId', String(filtros.sucursalId))
  return apiFetch<SuspensionRegistrada[]>(`${API}?${params.toString()}`, {
    mensajePorDefecto: 'Error al obtener el registro de suspensiones',
  })
}
