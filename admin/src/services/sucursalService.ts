import type {
  PayloadSucursal,
  RespuestaSucursal,
  Sucursal,
} from '../types/sucursal.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/sucursales`

export async function obtenerSucursales(): Promise<Sucursal[]> {
  return apiFetch(API, {
    mensajePorDefecto: 'Error al obtener las sucursales',
  })
}

export async function obtenerSucursalPorId(id: number): Promise<Sucursal> {
  return apiFetch(`${API}/${id}`, {
    mensajePorDefecto: 'Error al obtener la sucursal',
  })
}

export async function crearSucursal(
  sucursal: PayloadSucursal,
): Promise<RespuestaSucursal> {
  return apiFetch(`${API}/nueva`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sucursal),
    mensajePorDefecto: 'Error al crear la sucursal',
  })
}

export async function actualizarSucursal(
  id: number,
  sucursal: PayloadSucursal,
): Promise<RespuestaSucursal> {
  return apiFetch(`${API}/editar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sucursal),
    mensajePorDefecto: 'Error al actualizar la sucursal',
  })
}

export async function cambiarEstadoSucursal(
  id: number,
  activa: boolean,
): Promise<RespuestaSucursal> {
  return apiFetch(`${API}/estado/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activa }),
    mensajePorDefecto: 'Error al cambiar el estado de la sucursal',
  })
}
