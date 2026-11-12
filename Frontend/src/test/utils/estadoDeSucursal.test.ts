import { describe, expect, test } from 'vitest'
import { DIAS_SEMANA, type HorarioDia, type HorarioSemana } from '../../types/sucursal'
import { estadoDeSucursal } from '../../utils/horario'

const ZONA = 'America/Argentina/Buenos_Aires'
// Un miércoles al mediodía en Buenos Aires
const MEDIODIA = new Date('2026-11-04T15:00:00Z')

const semana = (dia: HorarioDia): HorarioSemana =>
  Object.fromEntries(DIAS_SEMANA.map((d) => [d, { ...dia }])) as HorarioSemana

const horarioAbierto = semana({ abierto: true, apertura: '00:00', cierre: '23:59' })
const horarioCerrado = semana({ abierto: false, apertura: '09:00', cierre: '23:00' })

describe('estadoDeSucursal', () => {
  test('un cierre temporal pesa más que el horario: queda cerrada', () => {
    const estado = estadoDeSucursal({ horario: horarioAbierto, zona_horaria: ZONA, cierreTemporal: true }, MEDIODIA)
    expect(estado.abierta).toBe(false)
    expect(estado.motivo).toMatch(/cerrada temporalmente/)
  })

  test('el cierre temporal no expone el motivo interno del encargado', () => {
    expect(estadoDeSucursal({ horario: horarioAbierto, cierreTemporal: true }, MEDIODIA).motivo).toBe(
      'La sucursal está cerrada temporalmente',
    )
  })

  test('sin cierre temporal decide el horario', () => {
    expect(estadoDeSucursal({ horario: horarioAbierto, zona_horaria: ZONA }, MEDIODIA).abierta).toBe(true)
    expect(estadoDeSucursal({ horario: horarioAbierto, cierreTemporal: false }, MEDIODIA).abierta).toBe(true)
    expect(estadoDeSucursal({ horario: horarioCerrado, zona_horaria: ZONA }, MEDIODIA).abierta).toBe(false)
  })
})
