import { apiFetch, API_URL } from './httpClient'
import type { PromocionAdmin } from '../types/promocion.types'

const API = `${API_URL}/admin/promociones`

// Solo el Admin-Master arma y modifica promociones: el backend rechaza a cualquier otro rol

export async function obtenerPromociones() {
  return apiFetch<PromocionAdmin[]>(API, {
    mensajePorDefecto: 'Error al obtener las promociones',
  })
}

export async function obtenerPromocionPorId(id: number) {
  return apiFetch<PromocionAdmin>(`${API}/${id}`, {
    mensajePorDefecto: 'Error al obtener la promoción',
  })
}

export async function crearPromocion(promocion: unknown) {
  return apiFetch(`${API}/nueva`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promocion),
    mensajePorDefecto: 'Error al crear la promoción',
  })
}

export async function actualizarPromocion(id: number, promocion: unknown) {
  return apiFetch(`${API}/editar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promocion),
    mensajePorDefecto: 'Error al actualizar la promoción',
  })
}

export async function eliminarPromocion(id: number) {
  await apiFetch(`${API}/eliminar/${id}`, {
    method: 'DELETE',
    mensajePorDefecto: 'Error al eliminar la promoción',
  })
}

export async function deshabilitarPromocion(id: number) {
  return apiFetch(`${API}/${id}/deshabilitar`, {
    method: 'PATCH',
    mensajePorDefecto: 'Error al deshabilitar la promoción',
  })
}

export async function habilitarPromocion(id: number) {
  return apiFetch(`${API}/${id}/habilitar`, {
    method: 'PATCH',
    mensajePorDefecto: 'Error al habilitar la promoción',
  })
}
