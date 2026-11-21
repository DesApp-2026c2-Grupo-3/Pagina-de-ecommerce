import { describe, expect, test } from 'vitest'

import {
  admiteCambiosDelAdmin,
  esEstadoFinal,
  estaEnCurso,
  fechaCancelacion,
  fechasPorPaso,
  formatearFechaHora,
  normalizarEstado,
  opcionesDeEtapa,
  pasoActual,
  puedePasarA,
} from '../../utils/pedidoEstado'
import type { RegistroTiempoPedido } from '../../types/pedido.types'

describe('normalizarEstado', () => {
  test.each([
    ['pendiente', 'Pendiente'],
    ['EN PROCESO', 'En proceso'],
    ['  listo para retirar  ', 'Listo para retirar'],
    ['en camino', 'En camino'],
    ['Entregado', 'Entregado'],
    ['cancelado', 'Cancelado'],
  ])('"%s" → "%s"', (estado, esperado) => {
    expect(normalizarEstado(estado)).toBe(esperado)
  })

  test('un estado desconocido se toma como Pendiente', () => {
    expect(normalizarEstado('confirmado')).toBe('Pendiente')
  })
})

describe('estados en curso y finales (RN-22)', () => {
  test.each(['Pendiente', 'En proceso', 'Listo para retirar', 'En camino'])('"%s" está en curso', (estado) => {
    expect(estaEnCurso(estado)).toBe(true)
    expect(esEstadoFinal(estado)).toBe(false)
  })

  test.each(['Entregado', 'Cancelado', 'entregado'])('"%s" es un estado final', (estado) => {
    expect(esEstadoFinal(estado)).toBe(true)
    expect(estaEnCurso(estado)).toBe(false)
  })
})

describe('transiciones que puede pedir el administrador (RN-23)', () => {
  test.each([
    ['Pendiente', 'En proceso'],
    ['Pendiente', 'Cancelado'],
    ['En proceso', 'Listo para retirar'],
    ['En proceso', 'Cancelado'],
    ['Listo para retirar', 'Cancelado'],
  ])('de "%s" puede pasar a "%s"', (actual, destino) => {
    expect(puedePasarA(actual, destino)).toBe(true)
  })

  test.each([
    ['Pendiente', 'Listo para retirar', 'no se saltean etapas'],
    ['En proceso', 'Pendiente', 'no se vuelve atrás'],
    ['Listo para retirar', 'En camino', 'la salida la marca el repartidor'],
    ['En camino', 'Entregado', 'la entrega la marca el repartidor'],
    ['En camino', 'Cancelado', 'un pedido en camino no se cancela desde el panel'],
    ['Entregado', 'Cancelado', 'un pedido entregado está cerrado'],
    ['Cancelado', 'Pendiente', 'un pedido cancelado está cerrado'],
  ])('de "%s" NO puede pasar a "%s" (%s)', (actual, destino) => {
    expect(puedePasarA(actual, destino)).toBe(false)
  })

  test('acepta los estados escritos en minúscula', () => {
    expect(puedePasarA('pendiente', 'en proceso')).toBe(true)
  })

  test.each([
    ['Pendiente', ['Pendiente', 'En proceso', 'Cancelado']],
    ['En proceso', ['En proceso', 'Listo para retirar', 'Cancelado']],
    ['Listo para retirar', ['Listo para retirar', 'Cancelado']],
    ['En camino', ['En camino']],
    ['Entregado', ['Entregado']],
  ])('el selector de "%s" ofrece la etapa actual y las permitidas', (actual, opciones) => {
    expect(opcionesDeEtapa(actual)).toEqual(opciones)
  })

  test.each([
    ['Pendiente', true],
    ['En proceso', true],
    ['Listo para retirar', true],
    ['En camino', false],
    ['Entregado', false],
    ['Cancelado', false],
  ])('¿el panel puede cambiar un pedido "%s"? %s', (estado, esperado) => {
    expect(admiteCambiosDelAdmin(estado)).toBe(esperado)
  })
})

describe('pasoActual', () => {
  test.each([
    ['Pendiente', 0],
    ['En proceso', 1],
    ['Listo para retirar', 2],
    ['En camino', 3],
    ['Entregado', 4],
  ])('"%s" está en el paso %s de la línea de tiempo', (estado, paso) => {
    expect(pasoActual(estado)).toBe(paso)
  })

  test('un pedido cancelado queda fuera de la línea de tiempo', () => {
    expect(pasoActual('Cancelado')).toBe(-1)
  })
})

describe('historial de estados (RN-24)', () => {
  const registro = (id: number, estado: string, fecha: string): RegistroTiempoPedido => ({
    id,
    estado,
    estadoAnterior: null,
    fecha,
  })

  test('arma la fecha de cada paso a partir del historial', () => {
    const fechas = fechasPorPaso([
      registro(1, 'pendiente', '2026-11-20T20:00:00Z'),
      registro(2, 'En proceso', '2026-11-20T20:05:00Z'),
    ])

    expect(fechas.get('Pendiente')).toBe('2026-11-20T20:00:00Z')
    expect(fechas.get('En proceso')).toBe('2026-11-20T20:05:00Z')
    expect(fechas.has('En camino')).toBe(false)
  })

  test('si un estado se repite, usa la última vez', () => {
    const fechas = fechasPorPaso([
      registro(1, 'En proceso', '2026-11-20T20:05:00Z'),
      registro(2, 'En proceso', '2026-11-20T20:15:00Z'),
    ])

    expect(fechas.get('En proceso')).toBe('2026-11-20T20:15:00Z')
  })

  test('la cancelación no es un paso de la línea de tiempo', () => {
    const fechas = fechasPorPaso([registro(1, 'Cancelado', '2026-11-20T20:10:00Z')])

    expect(fechas.size).toBe(0)
  })

  test('sin historial no hay fechas', () => {
    expect(fechasPorPaso([]).size).toBe(0)
  })

  test('encuentra la fecha de cancelación', () => {
    const historial = [
      registro(1, 'Pendiente', '2026-11-20T20:00:00Z'),
      registro(2, 'cancelado', '2026-11-20T20:10:00Z'),
    ]

    expect(fechaCancelacion(historial)).toBe('2026-11-20T20:10:00Z')
  })

  test('un pedido no cancelado no tiene fecha de cancelación', () => {
    expect(fechaCancelacion([registro(1, 'Pendiente', '2026-11-20T20:00:00Z')])).toBeNull()
  })
})

describe('formatearFechaHora', () => {
  test('muestra la fecha y la hora de Argentina', () => {
    const texto = formatearFechaHora('2026-11-20T23:30:00Z') // 20:30 en Buenos Aires

    expect(texto).toMatch(/20\/11\/(20)?26/)
    // Según el navegador, la hora sale en formato 24 h ("20:30") o 12 h ("8:30 p. m.")
    expect(texto).toMatch(/(20|8):30/)
  })

  test('una fecha inválida se muestra como un guion', () => {
    expect(formatearFechaHora('no es una fecha')).toBe('—')
  })
})