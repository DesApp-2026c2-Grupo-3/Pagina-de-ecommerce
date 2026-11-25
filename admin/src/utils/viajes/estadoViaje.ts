import type { EstadoViaje, FiltroEstadoViaje, TonoTarjeta, Viaje } from '../../types/viaje.types'

interface DefinicionEstado {
  valor: EstadoViaje
  etiqueta: string
  // Para el filtro: «Requieren asistencia (1)»
  plural: string
  // Colores de la etiqueta (siempre con texto: el color no es el único indicio)
  clases: string
}

// Orden en el que se muestran en el filtro
export const ESTADOS_VIAJE: DefinicionEstado[] = [
  { valor: 'preparando', etiqueta: 'Preparando', plural: 'Preparando', clases: 'bg-blue-100 text-blue-800' },
  { valor: 'activo', etiqueta: 'En curso', plural: 'En curso', clases: 'bg-green-100 text-green-800' },
  { valor: 'requiere asistencia', etiqueta: 'Requiere asistencia', plural: 'Requieren asistencia', clases: 'bg-red-100 text-red-800' },
  { valor: 'finalizado', etiqueta: 'Finalizado', plural: 'Finalizados', clases: 'bg-gray-200 text-gray-700' },
  { valor: 'cancelado', etiqueta: 'Cancelado', plural: 'Cancelados', clases: 'bg-gray-200 text-gray-700' },
]

const POR_VALOR = new Map(ESTADOS_VIAJE.map((e) => [e.valor, e]))

export function normalizarEstadoViaje(valor: string): string {
  return (valor ?? '').trim().toLowerCase()
}

export function etiquetaEstadoViaje(estado: string): string {
  return POR_VALOR.get(normalizarEstadoViaje(estado) as EstadoViaje)?.etiqueta ?? estado
}

export function clasesEstadoViaje(estado: string): string {
  return POR_VALOR.get(normalizarEstadoViaje(estado) as EstadoViaje)?.clases ?? 'bg-amber-100 text-amber-800'
}

export function requiereAsistencia(viaje: Pick<Viaje, 'estado'>): boolean {
  return normalizarEstadoViaje(viaje.estado) === 'requiere asistencia'
}

export function esFiltroEstadoViaje(valor: unknown): valor is FiltroEstadoViaje {
  return valor === 'todos' || (typeof valor === 'string' && POR_VALOR.has(valor as EstadoViaje))
}

// Rojo mientras pide asistencia (gana siempre) > ámbar si acaba de llegar > normal
export function tonoDeViaje(viaje: Pick<Viaje, 'estado'>, recienLlegado: boolean): TonoTarjeta {
  if (requiereAsistencia(viaje)) return 'alerta'
  return recienLlegado ? 'nuevo' : 'normal'
}
