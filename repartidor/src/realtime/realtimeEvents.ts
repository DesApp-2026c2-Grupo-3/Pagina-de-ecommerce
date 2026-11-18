import type {
  AccionRefresco,
  DominioRefresco,
  EventoRefrescoRepartidor,
  RecursosRefresco,
} from '../types/realtime.types'

// Nombres de los eventos que emite el servidor
export const EVENTOS = {
  notificacion: 'notificacion',
  notificacionLeida: 'notificacion:leida',
  refresco: 'repartidor:refresco',
  sesionRevocada: 'sesion:revocada',
} as const

// Códigos de un handshake rechazado por autenticación (D-18)
export const CODIGOS_AUTH = new Set(['AUTH_REQUIRED', 'AUTH_INVALID', 'AUTH_EXPIRED'])

const DOMINIOS: DominioRefresco[] = ['pedidos_disponibles', 'viaje']
const ACCIONES: AccionRefresco[] = ['creado', 'actualizado', 'eliminado', 'estado_cambiado']
const CLAVES_RECURSO = ['pedidoId', 'viajeId'] as const

type Registro = Record<string, unknown>

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

// Valida un `repartidor:refresco`; si no cumple el contrato se descarta (null)
export function normalizarEventoRefresco(valor: unknown): EventoRefrescoRepartidor | null {
  if (!esRegistro(valor) || valor.version !== 1) return null

  const { eventoId, dominio, accion, ocurridoEn } = valor
  const sucursalId = numeroPositivo(valor.sucursalId)

  if (typeof eventoId !== 'string' || !eventoId.trim()) return null
  if (typeof ocurridoEn !== 'string' || Number.isNaN(Date.parse(ocurridoEn))) return null
  if (!DOMINIOS.includes(dominio as DominioRefresco)) return null
  if (!ACCIONES.includes(accion as AccionRefresco)) return null
  if (sucursalId === null) return null

  const evento: EventoRefrescoRepartidor = {
    version: 1,
    eventoId,
    dominio: dominio as DominioRefresco,
    accion: accion as AccionRefresco,
    ocurridoEn,
    sucursalId,
  }

  const origenRepartidorId = numeroPositivo(valor.origenRepartidorId)
  if (origenRepartidorId !== null) evento.origenRepartidorId = origenRepartidorId

  if (esRegistro(valor.recursos)) {
    const recursos: RecursosRefresco = {}
    for (const clave of CLAVES_RECURSO) {
      const id = numeroPositivo(valor.recursos[clave])
      if (id !== null) recursos[clave] = id
    }
    if (Object.keys(recursos).length > 0) evento.recursos = recursos
  }

  return evento
}

// El motivo de sesion:revocada viene del servidor ('desactivado' | 'baja')
export function normalizarMotivoRevocacion(valor: unknown): 'desactivado' | 'baja' | 'asistencia' {
  if (esRegistro(valor) && (valor.motivo === 'baja' || valor.motivo === 'asistencia')) return valor.motivo
  return 'desactivado'
}
