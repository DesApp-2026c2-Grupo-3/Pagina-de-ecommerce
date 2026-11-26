import type { Viaje } from '../../types/viaje.types'
import { requiereAsistencia } from './estadoViaje'

export interface NovedadesViajes {
  // Viajes que no estaban en la carga anterior (recuadro ámbar unos segundos)
  nuevos: number[]
  // Viajes que pasaron a pedir asistencia (recuadro rojo mientras sigan así)
  asistencias: number[]
}

// Qué cambió entre dos cargas de la lista (para resaltar y anunciar, nunca para decidir reglas)
export function detectarNovedades(previos: Viaje[], actuales: Viaje[]): NovedadesViajes {
  const anteriores = new Map(previos.map((v) => [v.id, v]))
  const nuevos: number[] = []
  const asistencias: number[] = []
  for (const viaje of actuales) {
    const antes = anteriores.get(viaje.id)
    if (!antes) nuevos.push(viaje.id)
    if (requiereAsistencia(viaje) && (!antes || !requiereAsistencia(antes))) asistencias.push(viaje.id)
  }
  return { nuevos, asistencias }
}

// Texto para el lector de pantalla (aria-live)
export function textoAnuncioNovedades({ nuevos, asistencias }: NovedadesViajes): string {
  const partes: string[] = []
  if (asistencias.length === 1) partes.push(`El viaje #${asistencias[0]} requiere asistencia`)
  else if (asistencias.length > 1) partes.push(`${asistencias.length} viajes requieren asistencia`)
  const soloNuevos = nuevos.filter((id) => !asistencias.includes(id))
  if (soloNuevos.length === 1) partes.push(`Llegó el viaje #${soloNuevos[0]}`)
  else if (soloNuevos.length > 1) partes.push(`Llegaron ${soloNuevos.length} viajes nuevos`)
  return partes.join('. ')
}
