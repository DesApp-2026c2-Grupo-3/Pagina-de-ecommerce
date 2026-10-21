import type { AdministradorSesion } from '../types/sesion.types'
import { apiFetch, API_URL } from './httpClient'

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<AdministradorSesion> {
  return apiFetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    omitirExpiracion: true,
    mensajePorDefecto: 'Error al iniciar sesión',
  })
}

export async function cerrarSesionService() {
  return apiFetch(`${API_URL}/admin/logout`, {
    method: 'POST',
    omitirExpiracion: true,
    mensajePorDefecto: 'Error al cerrar sesión',
  })
}
