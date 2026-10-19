import { describe, expect, test } from 'vitest'
import { estadoSucursal, formatearHorario, zonaHorariaDeSucursal } from '../../utils/horario'
import { DIAS_SEMANA, ZONA_HORARIA_POR_DEFECTO, type HorarioSemana } from '../../types/sucursal'
import type { DiaSemana, HorarioDia } from '../../types/sucursal'

const ZONA = ZONA_HORARIA_POR_DEFECTO
const ABIERTO: HorarioDia = { apertura: '09:00', cierre: '23:00', abierto: true }

function semana(overrides: Partial<Record<DiaSemana, HorarioDia>> = {}): HorarioSemana {
  return Object.fromEntries(DIAS_SEMANA.map((dia) => [dia, { ...ABIERTO, ...overrides[dia] }])) as HorarioSemana
}

describe('estadoSucursal', () => {
  test('abierta dentro del horario', () => {
    const lunesNueve = new Date('2026-10-19T12:00:00Z')
    expect(estadoSucursal(semana(), ZONA, lunesNueve)).toEqual({ abierta: true, motivo: null })
  })

  test('cerrada antes de abrir', () => {
    const lunesOchoCincuentaYNueve = new Date('2026-10-19T11:59:00Z')
    const estado = estadoSucursal(semana(), ZONA, lunesOchoCincuentaYNueve)
    expect(estado.abierta).toBe(false)
    expect(estado.motivo).toContain('cerrada')
  })

  test('cerrada a la hora de cierre', () => {
    const martesVeintitres = new Date('2026-10-20T02:00:00Z')
    expect(estadoSucursal(semana(), ZONA, martesVeintitres).abierta).toBe(false)
  })

  test('cerrada el día que no atiende, con el motivo del día', () => {
    const domingoMediodia = new Date('2026-10-18T15:00:00Z')
    const estado = estadoSucursal(semana({ domingo: { ...ABIERTO, abierto: false } }), ZONA, domingoMediodia)
    expect(estado.abierta).toBe(false)
    expect(estado.motivo).toContain('domingo')
  })

  test('un horario que cruza la medianoche sigue abierto', () => {
    const sabadoUna = new Date('2026-10-17T04:00:00Z')
    const deNoche = semana({ sabado: { apertura: '18:00', cierre: '02:00', abierto: true } })
    expect(estadoSucursal(deNoche, ZONA, sabadoUna).abierta).toBe(true)
    expect(estadoSucursal(deNoche, ZONA, new Date('2026-10-17T06:00:00Z')).abierta).toBe(false)
  })

  test('sin horario o con formato viejo no bloquea', () => {
    expect(estadoSucursal(null).abierta).toBe(true)
    expect(estadoSucursal('11 a 23').abierta).toBe(true)
    expect(estadoSucursal({}).abierta).toBe(true)
  })

  test('una zona horaria inválida usa la de Buenos Aires', () => {
    const lunesNueve = new Date('2026-10-19T12:00:00Z')
    expect(estadoSucursal(semana(), 'Zona/Invalida', lunesNueve).abierta).toBe(true)
  })
})

describe('formatearHorario', () => {
  test('agrupa los días con el mismo horario', () => {
    expect(formatearHorario(semana())).toBe('Lun a Dom 09:00–23:00')
  })

  test('separa los días distintos', () => {
    const conDomingo = semana({ domingo: { apertura: '09:00', cierre: '23:00', abierto: false } })
    expect(formatearHorario(conDomingo)).toBe('Lun a Sáb 09:00–23:00 · Dom cerrado')
  })

  test('muestra el horario viejo tal cual', () => {
    expect(formatearHorario('Lun a Dom 11 a 23')).toBe('Lun a Dom 11 a 23')
  })

  test('sin datos devuelve un guion', () => {
    expect(formatearHorario(null)).toBe('—')
    expect(formatearHorario('')).toBe('—')
  })
})

describe('zonaHorariaDeSucursal', () => {
  test('mantiene una zona válida', () => {
    expect(zonaHorariaDeSucursal('America/Argentina/Cordoba')).toBe('America/Argentina/Cordoba')
  })

  test('cae en la de Buenos Aires si falta o no es válida', () => {
    expect(zonaHorariaDeSucursal(null)).toBe(ZONA_HORARIA_POR_DEFECTO)
    expect(zonaHorariaDeSucursal('Zona/Invalida')).toBe(ZONA_HORARIA_POR_DEFECTO)
  })
})
