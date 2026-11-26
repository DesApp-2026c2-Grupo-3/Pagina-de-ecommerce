import { describe, expect, test } from 'vitest'

import {
  coincideBusqueda,
  contarPorEtapa,
  esFiltroEtapa,
  filtrarPedidos,
} from '../../utils/pedidos/filtrarPedidos'
import { normalizarEtapa, normalizarPedidos } from '../../utils/pedidos/normalizarPedido'
import type { PedidoFila } from '../../types/pedido.types'

function pedido(id: number, estado: string, nombre = 'Juan', apellido = 'Pérez'): PedidoFila {
  return {
    id,
    fecha: '2026-11-24T14:00:00.000Z',
    total: '1000',
    estado,
    Usuario: { nombre, apellido },
    DetallePedidos: [],
  }
}

const lista = [
  pedido(1042, 'Pendiente'),
  pedido(1041, 'En proceso', 'Ana', 'Gómez'),
  pedido(1040, 'Pendiente', 'Martín', 'Sosa'),
  { ...pedido(1039, 'Cancelado'), Usuario: null },
]

describe('coincideBusqueda', () => {
  test.each([
    ['', true],
    ['juan', true],
    ['PÉREZ', true],
    ['juan pérez', true],
    ['1042', true],
    ['104', true],
    ['gómez', false],
  ])('"%s" → %s', (busqueda, esperado) => {
    expect(coincideBusqueda(lista[0], busqueda)).toBe(esperado)
  })

  test('un pedido sin cliente se encuentra por número', () => {
    expect(coincideBusqueda(lista[3], '1039')).toBe(true)
    expect(coincideBusqueda(lista[3], 'cliente')).toBe(false)
  })
})

describe('filtrarPedidos', () => {
  test('combina búsqueda y etapa', () => {
    const ids = filtrarPedidos(lista, { busqueda: 'o', etapa: 'Pendiente' }).map((p) => p.id)
    expect(ids).toEqual([1040])
  })

  test('"todas" no filtra por etapa', () => {
    expect(filtrarPedidos(lista, { busqueda: '', etapa: 'todas' })).toHaveLength(4)
  })
})

describe('contarPorEtapa', () => {
  test('cuenta cada etapa y el total sobre la búsqueda', () => {
    const contadores = contarPorEtapa(lista)
    expect(contadores.todas).toBe(4)
    expect(contadores.Pendiente).toBe(2)
    expect(contadores['En proceso']).toBe(1)
    expect(contadores.Cancelado).toBe(1)
    expect(contadores.Entregado).toBe(0)
  })

  test('respeta la búsqueda', () => {
    const contadores = contarPorEtapa(lista, 'ana')
    expect(contadores.todas).toBe(1)
    expect(contadores['En proceso']).toBe(1)
    expect(contadores.Pendiente).toBe(0)
  })
})

describe('esFiltroEtapa y normalización', () => {
  test.each([
    ['todas', true],
    ['Pendiente', true],
    ['Listo para retirar', true],
    ['pendiente', false],
    ['cualquiera', false],
    [null, false],
  ])('%s → %s', (valor, esperado) => {
    expect(esFiltroEtapa(valor)).toBe(esperado)
  })

  test('los estados viejos en minúscula se llevan a la forma canónica', () => {
    expect(normalizarEtapa('listo para retirar')).toBe('Listo para retirar')
    expect(normalizarEtapa('otro')).toBe('otro')
    expect(normalizarPedidos([pedido(1, 'pendiente')])[0].estado).toBe('Pendiente')
  })
})
