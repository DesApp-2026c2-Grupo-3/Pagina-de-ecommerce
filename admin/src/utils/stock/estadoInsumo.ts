import type { ItemStock } from '../../types/stock.types'

export type EstadoInsumo = 'normal' | 'bajo' | 'sin' | 'deshabilitado'

// Siempre con texto: el color no es el único indicio
export const ESTADOS_INSUMO: Record<EstadoInsumo, { etiqueta: string; clases: string }> = {
  normal: { etiqueta: 'Normal', clases: 'bg-green-100 text-green-800' },
  bajo: { etiqueta: 'Stock bajo', clases: 'bg-amber-100 text-amber-800' },
  sin: { etiqueta: 'Sin stock', clases: 'bg-red-100 text-red-800' },
  deshabilitado: { etiqueta: 'Deshabilitado', clases: 'bg-gray-200 text-gray-700' },
}

// Mismo criterio que la pantalla anterior: deshabilitado > sin stock > bajo el mínimo > normal
export function estadoInsumo(item: ItemStock): EstadoInsumo {
  if (!item.activo) return 'deshabilitado'
  if (item.cantidad <= 0) return 'sin'
  if (item.bajoMinimo) return 'bajo'
  return 'normal'
}

// En alerta de reposición (RN-11): sin stock o en el mínimo, solo si está activo
export function enAlerta(item: ItemStock): boolean {
  return item.activo && (item.cantidad <= 0 || item.bajoMinimo)
}
