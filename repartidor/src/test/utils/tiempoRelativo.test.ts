import { describe, expect, test } from 'vitest'

import { tiempoRelativo } from '../../utils/tiempoRelativo'

// 17/11/2026 15:00 en Argentina (UTC-3)
const AHORA = Date.parse('2026-11-17T18:00:00.000Z')
const hace = (ms: number) => new Date(AHORA - ms).toISOString()
const MIN = 60_000

describe('tiempoRelativo', () => {
  test('menos de un minuto: "recién"', () => {
    expect(tiempoRelativo(hace(20_000), AHORA)).toBe('recién')
  })

  test('minutos', () => {
    expect(tiempoRelativo(hace(3 * MIN), AHORA)).toMatch(/^hace 3 min/)
  })

  test('horas del mismo día', () => {
    expect(tiempoRelativo(hace(2 * 60 * MIN), AHORA)).toMatch(/^hace 2 h/)
  })

  test('el día anterior: "ayer"', () => {
    expect(tiempoRelativo('2026-11-16T22:00:00.000Z', AHORA)).toBe('ayer')
  })

  test('más viejo: fecha corta', () => {
    expect(tiempoRelativo('2026-11-12T15:00:00.000Z', AHORA)).toMatch(/12.*nov/)
  })

  test('un reloj algo adelantado no da tiempos negativos', () => {
    expect(tiempoRelativo(new Date(AHORA + 5_000).toISOString(), AHORA)).toBe('recién')
  })
})
