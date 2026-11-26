import type { Repartidor } from '../../types/repartidor.types'

export type FiltroEstadoRepartidor = 'todos' | 'activos' | 'inactivos' | 'enViaje'

// Siempre con texto: el color no es el único indicio
export const ETIQUETA_ACTIVO = { texto: 'Activo', clases: 'bg-green-100 text-green-800' }
export const ETIQUETA_INACTIVO = { texto: 'Inactivo', clases: 'bg-gray-200 text-gray-700' }
export const ETIQUETA_EN_VIAJE = { texto: 'En viaje', clases: 'bg-blue-100 text-blue-800' }

export function esFiltroEstadoRepartidor(valor: unknown): valor is FiltroEstadoRepartidor {
  return valor === 'todos' || valor === 'activos' || valor === 'inactivos' || valor === 'enViaje'
}

export function coincideEstadoRepartidor(r: Repartidor, filtro: FiltroEstadoRepartidor): boolean {
  if (filtro === 'activos') return r.activo
  if (filtro === 'inactivos') return !r.activo
  if (filtro === 'enViaje') return r.tieneViajeEnCurso
  return true
}

// D-R3: con un viaje en curso no se edita, no se desactiva ni se da de baja
// (el backend ya lo rechaza: 409 al editar o dar de baja, 400 al desactivar)
export function accionesBloqueadas(r: Repartidor): boolean {
  return r.tieneViajeEnCurso
}
