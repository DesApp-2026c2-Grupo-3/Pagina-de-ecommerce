import { describe, expect, test } from 'vitest'

import {
  aplicarDiaATodos,
  conflictosEntreDias,
  esHoraValida,
  esZonaHorariaValida,
  formatearHorario,
  formatearHorasExtras,
  formatearTurno,
  horarioPorDefecto,
  normalizarHorario,
  opcionesZonaHoraria,
  validarDia,
  validarHorario,
  validarTurno,
  validarZonaHoraria,
  ZONAS_HORARIAS,
} from '../../utils/horario'
import type { HorarioDia, HorarioSemana, HorarioTurno } from '../../types/sucursal.types'

const turno = (apertura: string, cierre: string, cruzaMedianoche = false): HorarioTurno => ({
  apertura,
  cierre,
  cruzaMedianoche,
})
const abierto = (...turnos: HorarioTurno[]): HorarioDia => ({ abierto: true, turnos })
const CERRADO: HorarioDia = { abierto: false, turnos: [] }

// Una semana de 09:00 a 23:00, con los cambios que pida cada test
const semana = (cambios: Partial<HorarioSemana> = {}): HorarioSemana => ({ ...horarioPorDefecto(), ...cambios })

describe('formatos válidos', () => {
  test.each(['00:00', '09:30', '23:59'])('"%s" es una hora válida', (hora) => {
    expect(esHoraValida(hora)).toBe(true)
  })

  test.each(['24:00', '9:00', '12:60', 'abc', ''])('"%s" no es una hora válida', (hora) => {
    expect(esHoraValida(hora)).toBe(false)
  })

  test.each(['America/Argentina/Buenos_Aires', 'America/Bogota', 'Europe/Madrid'])(
    '"%s" es una zona horaria válida',
    (zona) => {
      expect(esZonaHorariaValida(zona)).toBe(true)
      expect(validarZonaHoraria(zona)).toBe('')
    },
  )

  test.each(['Marte/Base', '', '   '])('"%s" no es una zona horaria válida', (zona) => {
    expect(esZonaHorariaValida(zona)).toBe(false)
    expect(validarZonaHoraria(zona)).toBe('Elegí una zona horaria válida.')
  })
})

describe('horarioPorDefecto y aplicarDiaATodos', () => {
  test('por defecto abre los 7 días de 09:00 a 23:00', () => {
    const horario = horarioPorDefecto()

    expect(Object.keys(horario)).toHaveLength(7)
    expect(horario.lunes).toEqual(abierto(turno('09:00', '23:00')))
    expect(horario.domingo).toEqual(abierto(turno('09:00', '23:00')))
  })

  test('cada día es un objeto nuevo: cambiar uno no cambia los demás', () => {
    const horario = horarioPorDefecto()

    horario.lunes.turnos[0].apertura = '10:00'

    expect(horario.martes.turnos[0].apertura).toBe('09:00')
  })

  test('copia el horario de un día a toda la semana', () => {
    const horario = semana({ viernes: abierto(turno('12:00', '15:00'), turno('19:00', '23:30')) })

    const resultado = aplicarDiaATodos(horario, 'viernes')

    expect(resultado.lunes).toEqual(horario.viernes)
    expect(resultado.domingo).toEqual(horario.viernes)
  })

  test('las copias son independientes entre sí', () => {
    const resultado = aplicarDiaATodos(horarioPorDefecto(), 'lunes')

    resultado.lunes.turnos[0].cierre = '20:00'

    expect(resultado.martes.turnos[0].cierre).toBe('23:00')
  })
})

describe('normalizarHorario (lo que llega del backend)', () => {
  test.each([
    ['nulo', null],
    ['un texto', 'Lunes a viernes de 9 a 18'],
    ['una lista', []],
  ])('un horario %s se reemplaza por el horario por defecto', (_, valor) => {
    expect(normalizarHorario(valor)).toEqual(horarioPorDefecto())
  })

  test('completa con el horario por defecto los días que faltan', () => {
    const horario = normalizarHorario({ lunes: CERRADO })

    expect(horario.lunes).toEqual(CERRADO)
    expect(horario.martes).toEqual(abierto(turno('09:00', '23:00')))
  })

  test('un día cerrado no conserva turnos', () => {
    expect(normalizarHorario({ lunes: { abierto: false, turnos: [turno('09:00', '18:00')] } }).lunes).toEqual(CERRADO)
  })

  test('convierte el formato viejo (apertura y cierre del día) en un turno', () => {
    expect(normalizarHorario({ lunes: { apertura: '10:00', cierre: '22:00' } }).lunes).toEqual(
      abierto(turno('10:00', '22:00')),
    )
  })

  test('deduce que el turno termina al día siguiente si el cierre es antes que la apertura', () => {
    const horario = normalizarHorario({ viernes: { abierto: true, turnos: [{ apertura: '20:00', cierre: '02:00' }] } })

    expect(horario.viernes.turnos[0].cruzaMedianoche).toBe(true)
  })

  test('un cierre a las 00:00 es el fin del día, no el día siguiente', () => {
    const horario = normalizarHorario({ lunes: { abierto: true, turnos: [{ apertura: '18:00', cierre: '00:00' }] } })

    expect(horario.lunes.turnos[0].cruzaMedianoche).toBe(false)
  })

  test('descarta los turnos con horas inválidas y se queda con 2 como máximo', () => {
    const horario = normalizarHorario({
      lunes: {
        abierto: true,
        turnos: [turno('09:00', '12:00'), { apertura: '25:00', cierre: '13:00' }, turno('19:00', '23:00')],
      },
    })

    expect(horario.lunes.turnos).toEqual([turno('09:00', '12:00')])
  })
})

describe('formatear para mostrar', () => {
  test.each([
    [turno('20:00', '02:00', true), '+2h'],
    [turno('20:00', '01:30', true), '+1h 30m'],
    [turno('23:00', '00:30', true), '+30m'],
    [turno('09:00', '23:00'), ''],
    [turno('10:00', '12:00', true), ''], // marcado como día siguiente pero no cruza: cruce inválido
  ])('horas extras de %o: "%s"', (t, esperado) => {
    expect(formatearHorasExtras(t)).toBe(esperado)
  })

  test.each([
    [turno('09:00', '23:00'), '09:00–23:00'],
    [turno('20:00', '02:00', true), '20:00–02:00 (+2h)'],
    [turno('10:00', '12:00', true), '10:00–12:00 (+1 día)'],
  ])('turno %o → "%s"', (t, esperado) => {
    expect(formatearTurno(t)).toBe(esperado)
  })

  test('agrupa los días seguidos con el mismo horario', () => {
    expect(formatearHorario(horarioPorDefecto())).toBe('Lun a Dom 09:00–23:00')
  })

  test('arma el resumen de una semana con días cerrados, turnos partidos y cierre de madrugada', () => {
    const horario = semana({
      lunes: CERRADO,
      viernes: abierto(turno('12:00', '15:00'), turno('19:00', '02:00', true)),
      sabado: abierto(turno('12:00', '15:00'), turno('19:00', '02:00', true)),
      domingo: abierto(turno('12:00', '16:00')),
    })

    expect(formatearHorario(horario)).toBe(
      'Lun cerrado · Mar a Jue 09:00–23:00 · Vie a Sáb 12:00–15:00 y 19:00–02:00 (+2h) · Dom 12:00–16:00',
    )
  })

  test('un horario viejo guardado como texto se muestra tal cual', () => {
    expect(formatearHorario('  Lun a Vie de 9 a 18  ')).toBe('Lun a Vie de 9 a 18')
  })

  test.each([
    ['un texto vacío', ''],
    ['nulo', null],
    ['un objeto sin días', { abre: '09:00' }],
  ])('un horario %s se muestra como un guion', (_, valor) => {
    expect(formatearHorario(valor)).toBe('—')
  })
})

describe('opcionesZonaHoraria', () => {
  test('ofrece las zonas de Argentina, empezando por Buenos Aires', () => {
    const opciones = opcionesZonaHoraria('America/Argentina/Cordoba')

    expect(opciones).toEqual(ZONAS_HORARIAS)
    expect(opciones[0]).toBe('America/Argentina/Buenos_Aires')
  })

  test('agrega la zona actual si no está en la lista, para no perderla', () => {
    expect(opcionesZonaHoraria('America/Bogota')).toEqual([...ZONAS_HORARIAS, 'America/Bogota'])
  })
})

describe('validarTurno', () => {
  test.each([
    ['un turno común', turno('09:00', '23:00')],
    ['un cierre a las 00:00 (fin del día)', turno('18:00', '00:00')],
    ['un cierre al día siguiente', turno('20:00', '02:00', true)],
  ])('acepta %s', (_, t) => {
    expect(validarTurno(t)).toBe('')
  })

  test.each([
    ['algo que no es un turno', null, 'el turno debe ser un objeto'],
    ['una apertura mal escrita', turno('9', '23:00'), 'la apertura debe tener formato HH:MM (ej: "09:00")'],
    ['un cierre mal escrito', turno('09:00', '25:00'), 'el cierre debe tener formato HH:MM (ej: "23:00")'],
    ['sin indicar el día siguiente', { apertura: '09:00', cierre: '23:00' }, 'debe indicar si el cierre es al día siguiente'],
    ['el cierre igual a la apertura', turno('09:00', '09:00'), 'el cierre no puede ser igual a la apertura'],
    [
      'un cierre a las 00:00 marcado como día siguiente',
      turno('20:00', '00:00', true),
      'el cierre "00:00" no puede ser al día siguiente; usalo como fin del día',
    ],
    [
      'día siguiente con el cierre después de la apertura',
      turno('09:00', '12:00', true),
      'está marcado como día siguiente pero el cierre no es anterior a la apertura',
    ],
    [
      'el cierre antes de la apertura sin marcar día siguiente',
      turno('20:00', '02:00'),
      'el cierre es anterior a la apertura: activá el botón de día siguiente o corregí el horario',
    ],
  ])('rechaza %s', (_, t, mensaje) => {
    expect(validarTurno(t)).toBe(mensaje)
  })
})

describe('validarDia', () => {
  test.each([
    ['un día con un turno', abierto(turno('09:00', '23:00'))],
    ['un día con turno partido', abierto(turno('11:00', '15:00'), turno('19:00', '23:00'))],
    ['un día cerrado', CERRADO],
  ])('acepta %s', (_, config) => {
    expect(validarDia('lunes', config)).toBe('')
  })

  test.each([
    ['sin horario', undefined, 'Completá el horario del lunes.'],
    [
      'sin indicar si abre',
      { abierto: 'si', turnos: [] } as unknown as HorarioDia,
      'El estado "abierto" del lunes debe ser true o false.',
    ],
    ['sin lista de turnos', { abierto: true } as unknown as HorarioDia, 'El lunes debe indicar sus turnos.'],
    [
      'con más de 2 turnos',
      abierto(turno('08:00', '10:00'), turno('11:00', '13:00'), turno('14:00', '16:00')),
      'El lunes admite como máximo 2 turnos.',
    ],
    ['cerrado pero con turnos', { abierto: false, turnos: [turno('09:00', '18:00')] }, 'El lunes está cerrado y no puede tener turnos.'],
    ['abierto pero sin turnos', abierto(), 'El lunes está abierto y debe tener al menos un turno.'],
    [
      'con un turno inválido',
      abierto(turno('09:00', '09:00')),
      'El turno 1 del lunes: el cierre no puede ser igual a la apertura.',
    ],
    [
      'con el primer turno cerrando al día siguiente y un segundo turno',
      abierto(turno('20:00', '02:00', true), turno('03:00', '05:00')),
      'El turno 1 del lunes termina al día siguiente, así que no puede tener un turno 2 el mismo día.',
    ],
    [
      'con los turnos superpuestos',
      abierto(turno('11:00', '16:00'), turno('15:00', '23:00')),
      'El turno 2 del lunes debe abrir después del cierre del turno 1 (11:00–16:00).',
    ],
    [
      'con un segundo turno después de un cierre a las 00:00',
      abierto(turno('11:00', '00:00'), turno('01:00', '03:00')),
      'El turno 2 del lunes debe abrir después del cierre del turno 1 (11:00–00:00).',
    ],
  ])('rechaza un día %s', (_, config, mensaje) => {
    expect(validarDia('lunes', config)).toBe(mensaje)
  })

  test('usa el nombre del día con acento en el mensaje', () => {
    expect(validarDia('miercoles', undefined)).toBe('Completá el horario del miércoles.')
  })
})

describe('conflictos entre días seguidos y validarHorario', () => {
  test('un horario por defecto es válido', () => {
    expect(validarHorario(horarioPorDefecto())).toBe('')
  })

  test('detecta un cierre de madrugada que se superpone con la apertura del día siguiente', () => {
    const horario = semana({
      viernes: abierto(turno('20:00', '03:00', true)),
      sabado: abierto(turno('02:00', '23:00')),
    })

    const [conflicto] = conflictosEntreDias(horario)

    expect(conflicto).toMatchObject({ dia: 'viernes', siguiente: 'sabado', cierre: '03:00', apertura: '02:00' })
    expect(validarHorario(horario)).toBe(
      'El cierre del viernes a las 03:00 (+3h) se superpone con la apertura del sábado a las 02:00. La apertura del sábado debe ser posterior a las 03:00.',
    )
  })

  test('controla también el cruce de domingo a lunes', () => {
    const horario = semana({
      domingo: abierto(turno('20:00', '10:00', true)),
    })

    expect(conflictosEntreDias(horario)[0]).toMatchObject({ dia: 'domingo', siguiente: 'lunes' })
  })

  test('no hay conflicto si el día siguiente abre después del cierre', () => {
    const horario = semana({ viernes: abierto(turno('20:00', '02:00', true)) })

    expect(conflictosEntreDias(horario)).toEqual([])
    expect(validarHorario(horario)).toBe('')
  })

  test('no hay conflicto si el día siguiente está cerrado', () => {
    const horario = semana({ viernes: abierto(turno('20:00', '10:00', true)), sabado: CERRADO })

    expect(conflictosEntreDias(horario)).toEqual([])
  })

  test('primero informa los errores de cada día', () => {
    const horario = semana({ martes: abierto() })

    expect(validarHorario(horario)).toBe('El martes está abierto y debe tener al menos un turno.')
  })
})