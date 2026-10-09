// Estados de un pedido tal como los guarda el backend (el panel de admin los cambia)
export const PASOS_SEGUIMIENTO = ['Pendiente', 'En proceso', 'En camino', 'Entregado'] as const

export type EstadoPedido = (typeof PASOS_SEGUIMIENTO)[number] | 'Cancelado'

// Acepta variantes viejas en minúscula ('pendiente', 'entregado'...)
export function normalizarEstado(estado: string): EstadoPedido {
  const limpio = estado.trim().toLowerCase()
  if (limpio === 'cancelado') return 'Cancelado'
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
  { id: 'curso', label: 'En curso', aplica: (estado: string) => estaEnCurso(estado) },
  { id: 'entregados', label: 'Entregados', aplica: (estado: string) => normalizarEstado(estado) === 'Entregado' },
  { id: 'cancelados', label: 'Cancelados', aplica: (estado: string) => normalizarEstado(estado) === 'Cancelado' },
] as const

export type FiltroPedido = (typeof FILTROS_PEDIDO)[number]['id']