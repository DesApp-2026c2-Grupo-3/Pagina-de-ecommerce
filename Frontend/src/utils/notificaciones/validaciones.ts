import type { TipoNotificacionCliente } from '../../types/notificacion.types'

export type Registro = Record<string, unknown>

const TIPOS_NOTIFICACION_CLIENTE: TipoNotificacionCliente[] = [
  'pedido.creado',
  'pedido.estado_cambiado',
  'sucursal.cerrada',
]

export function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

export function numeroNoNegativo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 ? numero : null
}

export function textoNoVacio(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null
}

export function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

export function fechaIso(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const limpio = valor.trim()
  if (!limpio) return null

  const timestamp = Date.parse(limpio)
  if (Number.isNaN(timestamp)) return null

  return new Date(timestamp).toISOString()
}

export function esTipoNotificacionCliente(
  valor: unknown,
): valor is TipoNotificacionCliente {
  return (
    typeof valor === 'string' &&
    TIPOS_NOTIFICACION_CLIENTE.includes(valor as TipoNotificacionCliente)
  )
}
