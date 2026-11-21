import type { Repartidor } from '../types/repartidor.types'
import type { SesionRepartidor } from '../types/sesion.types'

// Única puerta a localStorage de la app (plan 5.4)
const CLAVE_TOKEN = 'token'
const CLAVE_REPARTIDOR = 'repartidor'

type Registro = Record<string, unknown>

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string'
}

function esSucursal(valor: unknown): valor is Repartidor['Sucursal'] {
  return esRegistro(valor) && esEnteroPositivo(valor.id) && esTexto(valor.nombre)
}

export function esRepartidor(valor: unknown): valor is Repartidor {
  return (
    esRegistro(valor) &&
    esEnteroPositivo(valor.id) &&
    esTexto(valor.nombre) &&
    esTexto(valor.apellido) &&
    esTexto(valor.email) &&
    esEnteroPositivo(valor.sucursalId) &&
    (valor.Sucursal === undefined || esSucursal(valor.Sucursal))
  )
}

export function esSesionRepartidor(valor: unknown): valor is SesionRepartidor {
  return (
    esRegistro(valor) &&
    esTexto(valor.token) &&
    valor.token.trim() !== '' &&
    esRepartidor(valor.repartidor)
  )
}

export function leerToken(): string | null {
  const token = localStorage.getItem(CLAVE_TOKEN)?.trim()
  return token ? token : null
}

export function limpiarSesion() {
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_REPARTIDOR)
}

// Devuelve la sesión guardada, o null. Si está incompleta o corrupta, la limpia.
export function leerSesion(): SesionRepartidor | null {
  const token = leerToken()
  const crudo = localStorage.getItem(CLAVE_REPARTIDOR)

  if (!token && !crudo) return null

  try {
    const repartidor: unknown = crudo ? JSON.parse(crudo) : null
    if (token && esRepartidor(repartidor)) {
      return { token, repartidor }
    }
  } catch {
    // JSON inválido: se limpia abajo
  }

  limpiarSesion()
  return null
}

export function guardarSesion({ token, repartidor }: SesionRepartidor) {
  localStorage.setItem(CLAVE_TOKEN, token.trim())
  localStorage.setItem(CLAVE_REPARTIDOR, JSON.stringify(repartidor))
}

export function guardarRepartidor(repartidor: Repartidor) {
  localStorage.setItem(CLAVE_REPARTIDOR, JSON.stringify(repartidor))
}
