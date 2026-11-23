import type { AdministradorSesion } from '../types/sesion.types'

export const CLAVE_SESION = 'administrador'
export const CLAVE_TOKEN = 'token'
export const EVENTO_SESION_EXPIRADA = 'sesion-expirada'

export function leerToken(): string | null {
  const token = localStorage.getItem(CLAVE_TOKEN)
  return token?.trim() ? token : null
}

// Lee la sesión guardada. No hay sesión válida sin administrador y token.
export function leerSesion(): AdministradorSesion | null {
  try {
    const guardado = localStorage.getItem(CLAVE_SESION)
    if (!guardado || !leerToken()) return null

    const sesion = JSON.parse(guardado) as AdministradorSesion
    if (!('id' in sesion) || !('sucursalId' in sesion)) return null
    return sesion
  } catch {
    return null
  }
}

export function guardarSesion(sesion: AdministradorSesion, token: string) {
  if (!token.trim()) {
    throw new Error('La sesión no tiene un token válido')
  }

  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  localStorage.setItem(CLAVE_TOKEN, token)
}

export function limpiarSesion() {
  localStorage.removeItem(CLAVE_SESION)
  localStorage.removeItem(CLAVE_TOKEN)
}

// Avisa a la app para que cierre el socket y limpie la sesión en ese orden.
// No borra el storage por su cuenta: la secuencia vive en AuthContext.
export function notificarSesionExpirada() {
  if (!localStorage.getItem(CLAVE_SESION) && !leerToken()) return
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
}
