// D-15 v2: color del borde de un pedido disponible según cuánto hace que se hizo
export type NivelAntiguedad = 'reciente' | 'demorado' | 'urgente'

const MINUTO_MS = 60_000

// verde de 0 a menos de 5 min, amarillo de 5 a menos de 10, rojo desde 10.
// Una fecha inválida se trata como urgente para no esconder el pedido.
export function nivelAntiguedad(fechaIso: string, ahora: number): NivelAntiguedad {
  const minutos = (ahora - Date.parse(fechaIso)) / MINUTO_MS

  if (Number.isNaN(minutos)) return 'urgente'
  if (minutos < 5) return 'reciente'
  if (minutos < 10) return 'demorado'
  return 'urgente'
}

// Clases completas y fijas: Tailwind no detecta clases armadas por concatenación
export const BORDE_POR_NIVEL: Record<NivelAntiguedad, string> = {
  reciente: 'border-green-500',
  demorado: 'border-yellow-400',
  urgente: 'border-red-500',
}

export function minutosDesde(fechaIso: string, ahora: number): number | null {
  const minutos = Math.floor((ahora - Date.parse(fechaIso)) / MINUTO_MS)
  return Number.isNaN(minutos) ? null : Math.max(0, minutos)
}
