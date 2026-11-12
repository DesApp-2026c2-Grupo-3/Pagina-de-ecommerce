import type {
  AccionRefresco,
  DominioRefresco,
  EventoRefrescoAdmin,
  RecursosRefresco,
} from '../types/realtime.types'

type Registro = Record<string, unknown>

const DOMINIOS: DominioRefresco[] = [
  'stock',
  'pedidos',
  'productos',
  'sucursales',
  'reportes',
]

const ACCIONES: AccionRefresco[] = [
  'creado',
  'actualizado',
  'eliminado',
  'estado_cambiado',
]

const CLAVES_RECURSO = ['insumoId', 'pedidoId', 'productoId'] as const

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function textoNoVacio(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor : null
}

function fechaIso(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}

function normalizarRecursos(valor: unknown): RecursosRefresco | undefined {
  if (!esRegistro(valor)) return undefined

  const recursos: RecursosRefresco = {}

  for (const clave of CLAVES_RECURSO) {
    const id = numeroPositivo(valor[clave])
    if (id !== null) recursos[clave] = id
  }

  return Object.keys(recursos).length > 0 ? recursos : undefined
}

export function normalizarEventoRefresco(
  valor: unknown,
): EventoRefrescoAdmin | null {
  if (!esRegistro(valor) || valor.version !== 1) return null

  const eventoId = textoNoVacio(valor.eventoId)
  const dominio = valor.dominio
  const accion = valor.accion
  const ocurridoEn = fechaIso(valor.ocurridoEn)

  if (!eventoId || !ocurridoEn) return null
  if (!DOMINIOS.includes(dominio as DominioRefresco)) return null
  if (!ACCIONES.includes(accion as AccionRefresco)) return null

  const sucursalId = valor.sucursalId === null
    ? null
    : numeroPositivo(valor.sucursalId)

  if (valor.sucursalId !== null && sucursalId === null) return null
  if (dominio === 'stock' && sucursalId === null) return null

  const evento: EventoRefrescoAdmin = {
    version: 1,
    eventoId,
    dominio: dominio as DominioRefresco,
    accion: accion as AccionRefresco,
    ocurridoEn,
    sucursalId,
  }

  const recursos = normalizarRecursos(valor.recursos)
  if (recursos) evento.recursos = recursos

  return evento
}
