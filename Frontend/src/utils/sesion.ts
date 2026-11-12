import type { SesionCliente } from '../types/sesion.types'
import type { User } from '../types/user'

export const CLAVE_USUARIO = 'user'
export const CLAVE_TOKEN = 'token'

function esUsuarioValido(valor: unknown): valor is User {
  if (typeof valor !== 'object' || valor === null) return false

  const usuario = valor as Record<string, unknown>
  return (
    typeof usuario.id === 'number' &&
    Number.isInteger(usuario.id) &&
    usuario.id > 0 &&
    typeof usuario.name === 'string' &&
    typeof usuario.email === 'string'
  )
}

export function leerToken(): string | null {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN)?.trim()
    return token ? token : null
  } catch {
    return null
  }
}

export function leerSesion(): SesionCliente | null {
  try {
    const token = leerToken()
    const guardado = localStorage.getItem(CLAVE_USUARIO)

    if (!token || !guardado) {
      if (guardado || token) limpiarSesion()
      return null
    }

    const usuario: unknown = JSON.parse(guardado)

    if (!esUsuarioValido(usuario)) {
      limpiarSesion()
      return null
    }

    return { user: usuario, token }
  } catch {
    limpiarSesion()
    return null
  }
}

export function guardarSesion(sesion: SesionCliente) {
  const token = sesion.token.trim()

  if (!token) {
    throw new Error('La sesión no tiene un token válido')
  }

  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.user))
  localStorage.setItem(CLAVE_TOKEN, token)
}

export function limpiarSesion() {
  try {
    localStorage.removeItem(CLAVE_USUARIO)
    localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    return
  }
}
