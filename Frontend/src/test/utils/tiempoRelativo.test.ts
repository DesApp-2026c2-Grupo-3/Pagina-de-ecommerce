import { describe, expect, test } from 'vitest'
import { tiempoRelativo } from '../../utils/tiempoRelativo'
import { formatearDiaHora } from '../../utils/fechas'

const AHORA = Date.parse('2026-11-19T15:00:00.000Z')
const hace = (minutos: number) => new Date(AHORA - minutos * 60_000).toISOString()

describe('tiempoRelativo (C-4)', () => {
  test('menos de un minuto es «recién», también con el reloj algo atrasado', () => {
    expect(tiempoRelativo(hace(0.5), AHORA)).toBe('recién')
    expect(tiempoRelativo(hace(-1), AHORA)).toBe('recién')
  })

  test('minutos, horas y días', () => {
    expect(tiempoRelativo(hace(3), AHORA)).toBe('hace 3 min')
    expect(tiempoRelativo(hace(130), AHORA)).toBe('hace 2 h')
    expect(tiempoRelativo(hace(26 * 60), AHORA)).toBe('ayer')
    expect(tiempoRelativo(hace(4 * 24 * 60), AHORA)).toBe('hace 4 días')
  })

  test('desde una semana muestra la fecha', () => {
    const fecha = hace(8 * 24 * 60)
    expect(tiempoRelativo(fecha, AHORA)).toBe(formatearDiaHora(fecha))
  })

  test('una fecha inválida no muestra nada', () => {
    expect(tiempoRelativo('no-es-fecha', AHORA)).toBe('')
  })
})
