// Estados de un pedido tal como los guarda el backend (el panel de admin los cambia)
export const PASOS_SEGUIMIENTO = ['Pendiente', 'En proceso', 'En camino', 'Entregado'] as const

export type EstadoPedido = (typeof PASOS_SEGUIMIENTO)[number] | 'Cancelado'

// Estados internos entre el local y el repartidor que el cliente no ve.
// "Listo para retirar" (el pedido espera al repartidor) se muestra como "En proceso":
// sin esto caía en el valor por defecto y el cliente veía su pedido volver a "Pendiente".
const ESTADOS_INTERNOS = new Map<string, EstadoPedido>([
  ['listo para retirar', 'En proceso'],
])

export function esEstadoInterno(estado: string) {
  return ESTADOS_INTERNOS.has((estado ?? '').trim().toLowerCase())
}

// Acepta variantes viejas en minúscula ('pendiente', 'entregado'...)
export function normalizarEstado(estado: string): EstadoPedido {
  const limpio = (estado ?? '').trim().toLowerCase()
  if (limpio === 'cancelado') return 'Cancelado'
  const visible = ESTADOS_INTERNOS.get(limpio)
  if (visible) return visible
  return PASOS_SEGUIMIENTO.find((p) => p.toLowerCase() === limpio) ?? 'Pendiente'
}

export function estaEnCurso(estado: string) {
  const e = normalizarEstado(estado)
  return e !== 'Entregado' && e !== 'Cancelado'
}

// Posición en la barra de seguimiento (0 a 3)
export function pasoActual(estado: string) {
  return PASOS_SEGUIMIENTO.indexOf(normalizarEstado(estado) as (typeof PASOS_SEGUIMIENTO)[number])
}

// Colores de la etiqueta de estado
export const ESTILO_ESTADO: Record<EstadoPedido, string> = {
  Pendiente: 'bg-brand-mustard text-brand-dark',
  'En proceso': 'bg-brand-mustard text-brand-dark',
  'En camino': 'bg-brand-red text-white',
  Entregado: 'bg-brand-dark text-brand-cream',
  Cancelado: 'bg-brand-sand text-brand-muted',
}

// Filtros del historial
export const FILTROS_PEDIDO = [
  { id: 'todos', label: 'Todos', aplica: () => true },
  { id: 'entregados', label: 'Entregados', aplica: (estado: string) => normalizarEstado(estado) === 'Entregado' },
  { id: 'cancelados', label: 'Cancelados', aplica: (estado: string) => normalizarEstado(estado) === 'Cancelado' },
] as const

export type FiltroPedido = (typeof FILTROS_PEDIDO)[number]['id']