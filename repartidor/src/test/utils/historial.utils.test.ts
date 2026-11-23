import { describe, expect, test } from 'vitest'

import { filtrarViajes, formatearDuracion, formatearFecha } from '../../utils/historial.utils'
import type { EstadoViaje, ViajeHistorial } from '../../types/viaje.types'

// Fechas sin "Z": se interpretan en la hora local, así el test da igual en cualquier zona horaria
const viaje = (id: number, estado: EstadoViaje, fechaInicio: string | null): ViajeHistorial => ({
  id,
  repartidorId: 1,
  estado,
  fechaInicio,
  fechaFin: null,
  Pedidos: [],
})

const VIAJES: ViajeHistorial[] = [
  viaje(101, 'finalizado', '2026-11-10T12:00:00'),
  viaje(102, 'cancelado', '2026-11-15T20:30:00'),
  viaje(215, 'finalizado', '2026-11-18T09:15:00'),
  viaje(300, 'finalizado', null),
]

const ids = (viajes: ViajeHistorial[]) => viajes.map((v) => v.id)

describe('formatearFecha', () => {
  test('muestra la fecha y la hora en formato corto', () => {
    const texto = formatearFecha('2026-11-15T20:30:00')

    expect(texto).toMatch(/15\/11\/(20)?26/)
    // Según el navegador, la hora sale en formato 24 h ("20:30") o 12 h ("8:30 p. m.")
    expect(texto).toMatch(/(20|8):30/)
  })

  test.each([
    ['sin fecha', null],
    ['vacía', ''],
    ['inválida', 'no es una fecha'],
  ])('una fecha %s se muestra como "No disponible"', (_, fecha) => {
    expect(formatearFecha(fecha)).toBe('No disponible')
  })
})

describe('formatearDuracion', () => {
  test('menos de una hora se muestra en minutos', () => {
    expect(formatearDuracion('2026-11-15T20:00:00', '2026-11-15T20:35:00')).toBe('35 min')
  })

  test('más de una hora se muestra en horas y minutos', () => {
    expect(formatearDuracion('2026-11-15T20:00:00', '2026-11-15T21:25:00')).toBe('1 h 25 min')
  })

  test('descarta los segundos sueltos', () => {
    expect(formatearDuracion('2026-11-15T20:00:00', '2026-11-15T20:10:59')).toBe('10 min')
  })

  test('un viaje que terminó en el mismo minuto dura 0 min', () => {
    expect(formatearDuracion('2026-11-15T20:00:00', '2026-11-15T20:00:00')).toBe('0 min')
  })

  test.each([
    ['sin inicio', null, '2026-11-15T20:00:00'],
    ['sin fin (viaje en curso)', '2026-11-15T20:00:00', null],
    ['con el fin antes del inicio', '2026-11-15T21:00:00', '2026-11-15T20:00:00'],
    ['con una fecha inválida', 'mal', '2026-11-15T20:00:00'],
  ])('%s no hay duración', (_, inicio, fin) => {
    expect(formatearDuracion(inicio, fin)).toBe('No disponible')
  })
})

describe('filtrarViajes', () => {
  test('sin filtros devuelve todos los viajes', () => {
    expect(ids(filtrarViajes(VIAJES, 'todos', '', '', ''))).toEqual([101, 102, 215, 300])
  })

  test('filtra por estado', () => {
    expect(ids(filtrarViajes(VIAJES, 'cancelado', '', '', ''))).toEqual([102])
  })

  test('busca por número de viaje (también por parte del número)', () => {
    expect(ids(filtrarViajes(VIAJES, 'todos', '21', '', ''))).toEqual([215])
    expect(ids(filtrarViajes(VIAJES, 'todos', '10', '', ''))).toEqual([101, 102])
  })

  test('ignora los espacios de la búsqueda', () => {
    expect(ids(filtrarViajes(VIAJES, 'todos', '  215  ', '', ''))).toEqual([215])
  })

  test('filtra desde una fecha (incluida)', () => {
    expect(ids(filtrarViajes(VIAJES, 'todos', '', '2026-11-15', ''))).toEqual([102, 215])
  })

  test('filtra hasta una fecha (incluida)', () => {
    expect(ids(filtrarViajes(VIAJES, 'todos', '', '', '2026-11-15'))).toEqual([101, 102])
  })

  test('filtra entre dos fechas', () => {
    expect(ids(filtrarViajes(VIAJES, 'todos', '', '2026-11-11', '2026-11-17'))).toEqual([102])
  })

  test('con filtro de fecha, descarta los viajes sin fecha de inicio', () => {
    expect(ids(filtrarViajes(VIAJES, 'finalizado', '', '2026-01-01', ''))).not.toContain(300)
  })

  test('descarta un viaje con fecha inválida al filtrar por fecha', () => {
    const conFechaMala = [viaje(400, 'finalizado', 'fecha rota')]

    expect(filtrarViajes(conFechaMala, 'todos', '', '2026-01-01', '')).toEqual([])
  })

  test('combina estado, búsqueda y fechas', () => {
    expect(ids(filtrarViajes(VIAJES, 'finalizado', '1', '2026-11-01', '2026-11-30'))).toEqual([101, 215])
  })
})