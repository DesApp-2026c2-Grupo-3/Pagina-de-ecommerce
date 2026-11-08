import type { Parametros } from '../types/parametros.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/parametros`

export function obtenerParametros(): Promise<Parametros> {
  return apiFetch<Parametros>(API, { mensajePorDefecto: 'Error al obtener los parámetros' })
}

// Solo el master. Se mandan todos juntos.
export function guardarParametros(parametros: Parametros) {
  return apiFetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parametros),
    mensajePorDefecto: 'Error al guardar los parámetros',
  })
}