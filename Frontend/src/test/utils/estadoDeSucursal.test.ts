import { describe, expect, test } from 'vitest'
import { estadoDeSucursal } from '../../utils/horario'

describe('estadoDeSucursal', () => {
  test('un cierre temporal pesa más que el horario: queda cerrada', () => {
    const estado = estadoDeSucursal({ horario: null, zona_horaria: 'America/Argentina/Buenos_Aires', cierreTemporal: true })
    expect(estado.abierta).toBe(false)
    expect(estado.motivo).toMatch(/cerrada temporalmente/)
  })

  test('el cierre temporal no expone el motivo interno del encargado', () => {
    expect(estadoDeSucursal({ horario: null, cierreTemporal: true }).motivo).toBe('La sucursal está cerrada temporalmente')
  })

  test('sin cierre temporal decide el horario (sin horario cargado, está abierta)', () => {
    expect(estadoDeSucursal({ horario: null, zona_horaria: 'America/Argentina/Buenos_Aires' }).abierta).toBe(true)
    expect(estadoDeSucursal({ horario: null, cierreTemporal: false }).abierta).toBe(true)
  })
})
