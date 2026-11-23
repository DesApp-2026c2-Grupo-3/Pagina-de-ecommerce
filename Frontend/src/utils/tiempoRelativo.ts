import { formatearDiaHora } from './fechas'

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA
const SEMANA = 7 * DIA

const relativo = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto', style: 'short' })

// «recién», «hace 3 min», «hace 2 h», «ayer», «hace 4 días»; desde una semana, la fecha
export function tiempoRelativo(iso: string, ahora: number): string {
  const momento = Date.parse(iso)
  if (Number.isNaN(momento)) return ''

  // Un reloj del cliente un poco atrasado no muestra «dentro de…»
  const pasado = Math.max(0, ahora - momento)

  if (pasado < MINUTO) return 'recién'
  if (pasado < HORA) return relativo.format(-Math.floor(pasado / MINUTO), 'minute')
  if (pasado < DIA) return relativo.format(-Math.floor(pasado / HORA), 'hour')
  if (pasado < SEMANA) return relativo.format(-Math.floor(pasado / DIA), 'day')
  return formatearDiaHora(iso)
}
