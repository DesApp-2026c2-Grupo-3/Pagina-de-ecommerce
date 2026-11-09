import type { RespuestaLoginAdmin } from '../types/sesion.types'
import { apiFetch, API_URL } from './httpClient'

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<RespuestaLoginAdmin> {
  const sesion = await apiFetch<RespuestaLoginAdmin>(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    omitirExpiracion: true,
    mensajePorDefecto: 'Error al iniciar sesión',
  })

  if (
    !sesion ||
    typeof sesion.token !== 'string' ||
    !sesion.token.trim() ||
    typeof sesion.id !== 'number'
  ) {
    throw new Error('El servidor devolvió una sesión inválida')
  }

  return sesion
}

export async function cerrarSesionService(): Promise<void> {
  await apiFetch(`${API_URL}/admin/logout`, {
    method: 'POST',
    omitirExpiracion: true,
    mensajePorDefecto: 'Error al cerrar sesión',
  })
}
