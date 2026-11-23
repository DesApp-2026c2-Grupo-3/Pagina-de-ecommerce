import type { RegistroTiempoPedido } from '../types/pedido.types'

// Pasos de la línea de tiempo, en el mismo orden que valida el backend
export const PASOS_SEGUIMIENTO = ['Pendiente', 'En proceso', 'Listo para retirar', 'En camino', 'Entregado'] as const

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

// Lo que el ADMIN puede pedir desde cada estado (espejo de TRANSICIONES en
// Backend/src/controllers/admin/pedidoController.js).
// "En camino" y "Entregado" los marca el repartidor desde su app: el panel nunca los ofrece,
// y un pedido que ya salió con el repartidor queda en solo lectura.
const TRANSICIONES_ADMIN: Record<EstadoPedido, EstadoPedido[]> = {
  Pendiente: ['En proceso', 'Cancelado'],
  'En proceso': ['Listo para retirar', 'Cancelado'],
  'Listo para retirar': ['Cancelado'],
  'En camino': [],
  Entregado: [],
  Cancelado: [],
}

// ¿Puede el admin pedir este cambio? (el backend tiene la última palabra)
export function puedePasarA(estadoActual: string, destino: string) {
  return TRANSICIONES_ADMIN[normalizarEstado(estadoActual)].includes(normalizarEstado(destino))
}

// Etapas que ve el admin en el selector: la actual (marcada) y las que puede pedir
export function opcionesDeEtapa(estadoActual: string): EstadoPedido[] {
  const actual = normalizarEstado(estadoActual)
  return [actual, ...TRANSICIONES_ADMIN[actual]]
}

// ¿El panel todavía puede cambiar algo? (false en En camino, Entregado y Cancelado)
export function admiteCambiosDelAdmin(estadoActual: string) {
  return TRANSICIONES_ADMIN[normalizarEstado(estadoActual)].length > 0
}

// Posición en la línea de tiempo (0 a 3); -1 si es Cancelado (fuera del flujo)
export function pasoActual(estado: string) {
  return PASOS_SEGUIMIENTO.indexOf(normalizarEstado(estado) as (typeof PASOS_SEGUIMIENTO)[number])
}

// Colores de la etiqueta de cada estado (paleta del panel de administración)
export const COLORES_ETAPA: Record<EstadoPedido, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  'En proceso': 'bg-blue-100 text-blue-700',
  'Listo para retirar': 'bg-cyan-100 text-cyan-700',
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
