import { describe, expect, test } from 'vitest'
import { formatearFecha, formatearFechaHora } from '../../utils/fechas'

describe('formatearFecha', () => {
  test('formatea como DD/MM/AA', () => {
    expect(formatearFecha('1995-05-20')).toBe('20/05/95')
  })

  test('no corre la fecha un día por la zona horaria', () => {
    // A medianoche de Londres, en Argentina todavía es el día anterior
    expect(formatearFecha('1995-05-20T00:00:00.000Z')).toBe('20/05/95')
  })

  test('acepta un objeto Date', () => {
    expect(formatearFecha(new Date('2026-09-28T15:30:00-03:00'))).toBe('28/09/26')
  })

  test.each([null, undefined, '', 'no es una fecha'])('devuelve vacío para %s', (valor) => {
    expect(formatearFecha(valor)).toBe('')
  })
})

describe('formatearFechaHora', () => {
  test('muestra fecha y hora de Argentina, sin coma', () => {
    // 18:21 en Londres (UTC) son las 15:21 en Argentina
    expect(formatearFechaHora('2026-09-28T18:21:00.000Z')).toBe('28/09/26 15:21')
  })

  test('devuelve vacío si no hay fecha', () => {
    expect(formatearFechaHora(null)).toBe('')
  })
})