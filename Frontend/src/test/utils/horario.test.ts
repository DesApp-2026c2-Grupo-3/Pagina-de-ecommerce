import { describe, expect, test } from 'vitest'
import {
  assertHorarioSemana,
  estadoSucursal,
  formatearHorario,
  validarHorarioSemana,
  zonaHorariaDeSucursal,
} from '../../utils/horario'
import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
  type HorarioTurno,
} from '../../types/sucursal'

const ZONA = ZONA_HORARIA_POR_DEFECTO

function turno(apertura = '09:00', cierre = '23:00', cruzaMedianoche = false): HorarioTurno {
  return { apertura, cierre, cruzaMedianoche }
}

function dia(turnos: HorarioTurno[] = [turno()], abierto = true): HorarioDia {
  return { abierto, turnos }
}

function semana(overrides: Partial<Record<DiaSemana, HorarioDia>> = {}): HorarioSemana {
  return Object.fromEntries(DIAS_SEMANA.map((nombre) => [nombre, overrides[nombre] ?? dia()])) as HorarioSemana
}

const lunes = new Date('2026-10-05T12:00:00Z') // lunes 09:00 en Buenos Aires
const lunesMadrugada = new Date('2026-10-05T04:00:00Z') // lunes 01:00
const lunesNoche = new Date('2026-10-06T02:30:00Z') // lunes 23:30
const martesMadrugada = new Date('2026-10-06T04:00:00Z') // martes 01:00
const martesMediodia = new Date('2026-10-06T15:00:00Z') // martes 12:00
const martesTarde = new Date('2026-10-06T17:00:00Z') // martes 14:00
const domingoMediodia = new Date('2026-10-04T15:00:00Z') // domingo 12:00

describe('estadoSucursal', () => {
  test('abierta dentro del horario', () => {
    expect(estadoSucursal(semana(), ZONA, lunes)).toEqual({ abierta: true, motivo: null })
  })

  test('cerrada antes de abrir', () => {
    const estado = estadoSucursal(semana(), ZONA, new Date('2026-10-05T11:59:00Z'))
    expect(estado.abierta).toBe(false)
    expect(estado.motivo).toContain('cerrada')
    expect(estado.motivo).toContain('09:00 a 23:00')
  })

  test('cerrada a la hora de cierre', () => {
    expect(estadoSucursal(semana(), ZONA, new Date('2026-10-06T02:00:00Z')).abierta).toBe(false)
  })

  test('cerrada el día que no atiende, con el motivo del día', () => {
    const estado = estadoSucursal(semana({ domingo: dia([], false) }), ZONA, domingoMediodia)
    expect(estado.abierta).toBe(false)
    expect(estado.motivo).toContain('domingo')
  })

  test('evalúa dos turnos del mismo día', () => {
    const horario = semana({
      martes: dia([turno('09:00', '13:00'), turno('17:00', '23:00')]),
    })

    expect(estadoSucursal(horario, ZONA, martesMediodia).abierta).toBe(true)
    expect(estadoSucursal(horario, ZONA, martesTarde).abierta).toBe(false)
    expect(estadoSucursal(horario, ZONA, new Date('2026-10-06T22:00:00Z')).abierta).toBe(true)
  })

  test('informa todos los turnos cuando está cerrada', () => {
    const horario = semana({
      martes: dia([turno('09:00', '13:00'), turno('17:00', '01:00', true)]),
    })

    expect(estadoSucursal(horario, ZONA, martesTarde)).toEqual({
      abierta: false,
      motivo: 'La sucursal se encuentra cerrada en este horario. Atiende de 09:00 a 13:00 y de 17:00 a 01:00 (+1)',
    })
  })

  test('soporta horarios que cruzan la medianoche', () => {
    const horario = semana({
      lunes: dia([turno('22:00', '02:00', true)]),
      martes: dia([turno('09:00', '13:00')]),
    })

    expect(estadoSucursal(horario, ZONA, lunesNoche).abierta).toBe(true)
    expect(estadoSucursal(horario, ZONA, martesMadrugada).abierta).toBe(true)
    expect(estadoSucursal(horario, ZONA, martesMediodia).abierta).toBe(true)
    expect(estadoSucursal(horario, ZONA, martesTarde).abierta).toBe(false)
  })

  test('la madrugada del lunes sigue abierta por el turno nocturno del domingo', () => {
    const horario = semana({
      domingo: dia([turno('22:00', '02:00', true)]),
      lunes: dia([], false),
    })

    expect(estadoSucursal(horario, ZONA, lunesMadrugada)).toEqual({ abierta: true, motivo: null })
    expect(estadoSucursal(horario, ZONA, lunes).abierta).toBe(false)
  })

  test('interpreta el cierre 00:00 como fin del día', () => {
    const horario = semana({ lunes: dia([turno('18:00', '00:00')]) })

    expect(estadoSucursal(horario, ZONA, lunesNoche).abierta).toBe(true)
    expect(estadoSucursal(horario, ZONA, martesMadrugada).abierta).toBe(false)
  })

  test('ignora el turno nocturno inválido del día anterior', () => {
    const horario = semana({
      domingo: dia([turno('22:00', '00:00', true)]),
      lunes: dia([turno('09:00', '23:00')]),
    })

    expect(estadoSucursal(horario, ZONA, lunesMadrugada).abierta).toBe(false)
  })

  test('falla si el día abierto no tiene turnos válidos', () => {
    const horario = semana({ lunes: dia([turno('9:00', '23:00')]) })

    expect(() => estadoSucursal(horario, ZONA, lunes)).toThrow('no tiene turnos válidos')
  })

  test('una zona horaria inválida usa la de Buenos Aires', () => {
    expect(estadoSucursal(semana(), 'Zona/Invalida', lunes).abierta).toBe(true)
  })
})

describe('validarHorarioSemana', () => {
  test('acepta un horario con un turno por día', () => {
    expect(validarHorarioSemana(semana())).toBeNull()
  })

  test('acepta turnos dobles y un turno nocturno', () => {
    const horario = semana({
      martes: dia([turno('09:00', '13:00'), turno('17:00', '01:00', true)]),
    })

    expect(validarHorarioSemana(horario)).toBeNull()
  })

  test('rechaza valores que no son un horario', () => {
    expect(validarHorarioSemana(null)).toContain('objeto')
    expect(validarHorarioSemana('11 a 23')).toContain('objeto')
    expect(validarHorarioSemana([])).toContain('objeto')
  })

  test('rechaza el formato viejo y los días incompletos', () => {
    const viejo = { lunes: { apertura: '09:00', cierre: '23:00', abierto: true } }
    expect(validarHorarioSemana(viejo)).toBe('El lunes debe indicar sus turnos')

    const incompleto = semana()
    delete (incompleto as Partial<HorarioSemana>).lunes
    expect(validarHorarioSemana(incompleto)).toBe('Falta el horario del lunes')
  })

  test('rechaza días cerrados con turnos y abiertos sin turnos', () => {
    expect(validarHorarioSemana(semana({ lunes: dia([turno()], false) }))).toBe(
      'El lunes está cerrado y no puede tener turnos',
    )
    expect(validarHorarioSemana(semana({ lunes: dia([], true) }))).toBe(
      'El lunes está abierto y debe tener al menos un turno',
    )
  })

  test('rechaza turnos inválidos', () => {
    expect(validarHorarioSemana(semana({ lunes: dia([turno('9:00', '23:00')]) }))).toContain('formato HH:MM')
    expect(validarHorarioSemana(semana({ lunes: dia([turno('09:00', '24:00')]) }))).toContain('formato HH:MM')
    expect(validarHorarioSemana(semana({ lunes: dia([{ apertura: '09:00', cierre: '23:00' } as HorarioTurno]) }))).toContain(
      'cruza la medianoche',
    )
    expect(validarHorarioSemana(semana({ lunes: dia([turno('09:00', '09:00')]) }))).toContain(
      'no puede ser igual',
    )
  })

  test('rechaza más de dos turnos y el solapamiento dentro del día', () => {
    expect(
      validarHorarioSemana(
        semana({ lunes: dia([turno('09:00', '12:00'), turno('13:00', '17:00'), turno('18:00', '23:00')]) }),
      ),
    ).toBe('El lunes admite como máximo 2 turnos')

    expect(
      validarHorarioSemana(semana({ lunes: dia([turno('09:00', '13:00'), turno('12:00', '23:00')]) })),
    ).toContain('debe abrir después del cierre del turno 1')

    expect(
      validarHorarioSemana(semana({ lunes: dia([turno('18:00', '02:00', true), turno('09:00', '13:00')]) })),
    ).toContain('no puede tener un turno 2 el mismo día')
  })

  test('rechaza el solapamiento entre días por un cierre nocturno', () => {
    const horario = semana({
      domingo: dia([turno('22:00', '02:00', true)]),
      lunes: dia([turno('00:00', '08:00')]),
    })

    expect(validarHorarioSemana(horario)).toContain('se superpone con la apertura del lunes')
  })

  test('assertHorarioSemana lanza un error descriptivo', () => {
    expect(() => assertHorarioSemana('11 a 23')).toThrow('El horario debe ser un objeto')
    expect(() => assertHorarioSemana(semana())).not.toThrow()
  })
})

describe('formatearHorario', () => {
  test('agrupa los días con el mismo horario', () => {
    expect(formatearHorario(semana())).toBe('Lun a Dom 09:00–23:00')
  })

  test('separa los días distintos', () => {
    expect(formatearHorario(semana({ domingo: dia([], false) }))).toBe('Lun a Sáb 09:00–23:00 · Dom cerrado')
  })

  test('muestra turnos dobles', () => {
    const horario = semana({
      martes: dia([turno('09:00', '13:00'), turno('17:00', '23:00')]),
    })

    expect(formatearHorario(horario)).toBe(
      'Lun 09:00–23:00 · Mar 09:00–13:00 y 17:00–23:00 · Mié a Dom 09:00–23:00',
    )
  })

  test('muestra el cruce de medianoche', () => {
    expect(formatearHorario(semana({ lunes: dia([turno('22:00', '02:00', true)]) }))).toBe(
      'Lun 22:00–02:00 (+1) · Mar a Dom 09:00–23:00',
    )
  })

  test('falla si falta un día o un día abierto no tiene turnos', () => {
    expect(() => formatearHorario({} as HorarioSemana)).toThrow('Falta el horario del lunes')
    expect(() => formatearHorario(semana({ lunes: dia([], true) }))).toThrow('El lunes está abierto y no tiene turnos')
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
