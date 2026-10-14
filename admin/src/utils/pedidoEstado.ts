import type { RegistroTiempoPedido } from '../types/pedido'

// Pasos de la línea de tiempo, en el mismo orden que valida el backend
export const PASOS_SEGUIMIENTO = ['Pendiente', 'En proceso', 'En camino', 'Entregado'] as const

export type EstadoPedido = (typeof PASOS_SEGUIMIENTO)[number] | 'Cancelado'

// Acepta variantes viejas en minúscula ('pendiente', 'entregado'...)
export function normalizarEstado(estado: string): EstadoPedido {
  const limpio = (estado ?? '').trim().toLowerCase()
  if (limpio === 'cancelado') return 'Cancelado'
  return PASOS_SEGUIMIENTO.find((p) => p.toLowerCase() === limpio) ?? 'Pendiente'
}

export function estaEnCurso(estado: string) {
  const e = normalizarEstado(estado)
  return e !== 'Entregado' && e !== 'Cancelado'
}

// Pedido cerrado: ya no admite cambios (espejo de ESTADOS_FINALES del backend)
export function esEstadoFinal(estado: string) {
  const e = normalizarEstado(estado)
  return e === 'Entregado' || e === 'Cancelado'
}

// Pendiente es solo el estado inicial: una vez abandonado nunca se puede volver.
// Espejo de la validación del backend en PATCH /admin/pedidos/editar/estado/:id
export function esRetornoAPendienteProhibido(estadoActual: string, destino: string) {
  return (
    normalizarEstado(destino) === 'Pendiente' &&
    normalizarEstado(estadoActual) !== 'Pendiente'
  )
}

// ¿Se puede pedir el cambio de estado? (el backend tiene la última palabra)
export function puedePasarA(estadoActual: string, destino: string) {
  if (esEstadoFinal(estadoActual)) return false
  if (esRetornoAPendienteProhibido(estadoActual, destino)) return false
  return normalizarEstado(destino) !== normalizarEstado(estadoActual)
}

// Posición en la línea de tiempo (0 a 3); -1 si es Cancelado (fuera del flujo)
export function pasoActual(estado: string) {
  return PASOS_SEGUIMIENTO.indexOf(normalizarEstado(estado) as (typeof PASOS_SEGUIMIENTO)[number])
}

// Colores de la etiqueta de cada estado (paleta del panel de administración)
export const COLORES_ETAPA: Record<EstadoPedido, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  'En proceso': 'bg-blue-100 text-blue-700',
  'En camino': 'bg-purple-100 text-purple-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
}

// Fecha y hora de cada paso según los registros del historial.
// Si un estado se visitó varias veces (avance → retroceso → re-avance),
// se toma la última ocurrencia, coherente con la posición actual del pedido.
// Los pasos sin registro quedan en null.
export function fechasPorPaso(historial: RegistroTiempoPedido[]): Map<string, string> {
  const fechas = new Map<string, string>()
  for (const registro of historial ?? []) {
    const estado = normalizarEstado(registro.estado)
    if ((PASOS_SEGUIMIENTO as readonly string[]).includes(estado)) {
      fechas.set(estado, registro.fecha)
    }
  }
  return fechas
}

// Último registro de cancelación, si existe (el pedido pudo cancelarse una sola vez)
export function fechaCancelacion(historial: RegistroTiempoPedido[]): string | null {
  const cancelaciones = (historial ?? []).filter((r) => normalizarEstado(r.estado) === 'Cancelado')
  return cancelaciones.length > 0 ? cancelaciones[cancelaciones.length - 1].fecha : null
}

export function formatearFechaHora(valor: string) {
  const fecha = new Date(valor)
  // Si el back manda null/fecha corrupta, no se rompe la UI: se muestra el placeholder
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
