import { describe, expect, test } from 'vitest'
import {
  estadoSucursal,
  formatearExceso,
  formatearHorario,
  validarHorarioSemana,
  zonaHorariaDeSucursal,
} from '../../utils/horario'
import { DIAS_SEMANA, ZONA_HORARIA_POR_DEFECTO, type HorarioDia, type HorarioSemana } from '../../types/sucursal'

const dia = (apertura = '09:00', cierre = '23:00', extra: Partial<HorarioDia> = {}): HorarioDia => ({
  abierto: true,
  apertura,
  cierre,
  ...extra,
})
const cerrado = (): HorarioDia => ({ abierto: false, apertura: '09:00', cierre: '23:00' })
const semana = (config: Partial<HorarioSemana> = {}): HorarioSemana =>
  Object.fromEntries(DIAS_SEMANA.map((d) => [d, config[d] ?? dia()])) as HorarioSemana

// Instantes en Buenos Aires (UTC-3)
const lunes0900 = new Date('2026-10-05T12:00:00Z')
const lunes0800 = new Date('2026-10-05T11:00:00Z')
const lunes2330 = new Date('2026-10-06T02:30:00Z')
const martes0100 = new Date('2026-10-06T04:00:00Z')
const martes0230 = new Date('2026-10-06T05:30:00Z')

describe('zonaHorariaDeSucursal', () => {
  test('usa la zona de la sucursal y, si es inválida o falta, la de Buenos Aires', () => {
    expect(zonaHorariaDeSucursal('Asia/Tokyo')).toBe('Asia/Tokyo')
    for (const mala of ['Marte/Olympus', '  ', null, undefined]) {
      expect(zonaHorariaDeSucursal(mala)).toBe(ZONA_HORARIA_POR_DEFECTO)
    }
  })
})

describe('validarHorarioSemana (solo la forma)', () => {
  test('acepta un horario con los siete días', () => {
    expect(validarHorarioSemana(semana())).toBeNull()
  })

  test('rechaza lo que no es un horario o un día incompleto', () => {
    for (const malo of [null, [], 'texto', 42]) expect(validarHorarioSemana(malo)).not.toBeNull()
    const incompleto = { ...semana(), martes: { abierto: true } }
    expect(validarHorarioSemana(incompleto)).toBe('El horario del martes está incompleto')
  })
})

describe('estadoSucursal', () => {
  test('abierta dentro del horario y cerrada fuera, con el motivo', () => {
    expect(estadoSucursal(semana(), ZONA_HORARIA_POR_DEFECTO, lunes0900)).toEqual({ abierta: true, motivo: null })
    expect(estadoSucursal(semana(), ZONA_HORARIA_POR_DEFECTO, lunes0800)).toEqual({
      abierta: false,
      motivo: 'La sucursal se encuentra cerrada en este horario. Atiende de 09:00 a 23:00',
    })
  })

  test('un día cerrado informa que no atiende', () => {
    expect(estadoSucursal(semana({ lunes: cerrado() }), ZONA_HORARIA_POR_DEFECTO, lunes0900)).toEqual({
      abierta: false,
      motivo: 'La sucursal no atiende los lunes',
    })
  })

  test('23:59 llega hasta el final del día', () => {
    expect(estadoSucursal(semana({ lunes: dia('18:00', '23:59') }), ZONA_HORARIA_POR_DEFECTO, lunes2330).abierta).toBe(true)
  })

  test('la transnoche mantiene abierta la madrugada siguiente', () => {
    const horario = semana({ lunes: dia('18:00', '23:59', { transnocheMin: 120 }), martes: dia('12:00', '20:00') })
    expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, martes0100).abierta).toBe(true) // 01:00
    expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, martes0230).abierta).toBe(false) // 02:30
  })

  test('el motivo muestra la transnoche con su exceso', () => {
    const horario = semana({ lunes: dia('18:00', '23:59', { transnocheMin: 150 }) })
    expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, lunes0900).motivo).toBe(
      'La sucursal se encuentra cerrada en este horario. Atiende de 18:00 a 23:59 +02:30',
    )
  })

  test('usa la zona horaria de la sucursal', () => {
    const horario = semana({ lunes: dia('08:00', '10:00') })
    expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, lunes0900).abierta).toBe(true)
    expect(estadoSucursal(horario, 'Asia/Tokyo', lunes0900).abierta).toBe(false)
  })

  test('un horario ausente o con datos incoherentes no bloquea', () => {
    expect(estadoSucursal(undefined as unknown as HorarioSemana, ZONA_HORARIA_POR_DEFECTO, lunes0900).abierta).toBe(true)
    expect(estadoSucursal(semana({ lunes: dia('18:00', '02:00') }), ZONA_HORARIA_POR_DEFECTO, lunes0900).abierta).toBe(true)
  })
})

describe('formatearHorario y formatearExceso', () => {
  test('agrupa los días consecutivos iguales', () => {
    const horario = semana({ sabado: dia('10:00', '23:59', { transnocheMin: 150 }), domingo: cerrado() })
    expect(formatearHorario(horario)).toBe('Lun a Vie 09:00 a 23:00 · Sáb 10:00 a 23:59 +02:30 · Dom cerrado')
  })

  test('el exceso se muestra como +hh:mm', () => {
    expect(formatearExceso(150)).toBe('+02:30')
    expect(formatearExceso(360)).toBe('+06:00')
    expect(formatearExceso(5)).toBe('+00:05')
  })
})
