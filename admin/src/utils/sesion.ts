import type { AdministradorSesion } from '../types/sesion.types'

export const CLAVE_SESION = 'administrador'
export const EVENTO_SESION_EXPIRADA = 'sesion-expirada'

// Lee la sesión guardada. Descarta sesiones viejas (sin id ni sucursalId).
export function leerSesion(): AdministradorSesion | null {
  try {
    const guardado = localStorage.getItem(CLAVE_SESION)
    if (!guardado) return null
    const sesion = JSON.parse(guardado) as AdministradorSesion
    if (!('id' in sesion) || !('sucursalId' in sesion)) return null
    return sesion
  } catch {
    return null
  }
}

export function guardarSesion(sesion: AdministradorSesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
}

export function limpiarSesion() {
  localStorage.removeItem(CLAVE_SESION)
}

// Borra la sesión local y avisa a la app. Es idempotente: si ya no hay
// sesión guardada no vuelve a emitir el evento (evita redirects duplicados).
export function notificarSesionExpirada() {
  if (!leerSesion()) return
  limpiarSesion()
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
}
