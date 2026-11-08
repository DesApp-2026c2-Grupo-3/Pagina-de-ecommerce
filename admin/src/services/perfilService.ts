import type { Perfil } from '../types/notificacion.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/perfil`

export async function obtenerPerfil() {
  return apiFetch<Perfil>(API, { mensajePorDefecto: 'Error al obtener el perfil' })
}

export async function cambiarPassword(passwordActual: string, passwordNueva: string) {
  return apiFetch<{ mensaje: string }>(`${API}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passwordActual, passwordNueva }),
    mensajePorDefecto: 'Error al cambiar la contraseña',
  })
}
