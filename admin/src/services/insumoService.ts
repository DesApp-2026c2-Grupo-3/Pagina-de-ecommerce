import type { DatosInsumo, Insumo } from '../types/insumo.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/insumos`

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export function obtenerInsumos(): Promise<Insumo[]> {
  return apiFetch(`${API}/`, {
    mensajePorDefecto: 'Error al obtener los insumos',
  })
}

export function crearInsumo(datos: DatosInsumo) {
  return apiFetch(`${API}/nuevo`, {
    ...json('POST', datos),
    mensajePorDefecto: 'Error al crear el insumo',
  })
}

export function actualizarInsumo(id: number, datos: DatosInsumo) {
  return apiFetch(`${API}/editar/${id}`, {
    ...json('PATCH', datos),
    mensajePorDefecto: 'Error al editar el insumo',
  })
}

export function eliminarInsumo(id: number) {
  return apiFetch(`${API}/eliminar/${id}`, {
    method: 'DELETE',
    mensajePorDefecto: 'Error al eliminar el insumo',
  })
}
