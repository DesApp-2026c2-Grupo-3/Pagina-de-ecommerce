import { describe, expect, test } from 'vitest'

import { POR_PAGINA_REPARTIDORES } from '../../config/repartidores'
import type { Repartidor } from '../../types/repartidor.types'
import { paginar } from '../../utils/listas/paginar'
import { accionesBloqueadas, coincideEstadoRepartidor } from '../../utils/repartidores/estadoRepartidor'
import {
  contarPorEstadoRepartidor,
  filtrarRepartidores,
  nombreCompleto,
  sucursalesDeLaLista,
} from '../../utils/repartidores/filtrarRepartidores'

const centro = { id: 1, nombre: 'Sucursal Centro' }
const norte = { id: 2, nombre: 'Sucursal Norte' }

function rep(id: number, nombre: string, extra: Partial<Repartidor> = {}): Repartidor {
  return {
    id, nombre, apellido: 'Pérez', email: `${nombre.toLowerCase()}@burgerfast.com`, sucursalId: 1,
    activo: true, createdAt: '2026-11-01T00:00:00.000Z', sucursal: centro, tieneViajeEnCurso: false, ...extra,
  }
}

const lista = [
  rep(1, 'Carlos'),
  rep(2, 'Lucía', { tieneViajeEnCurso: true }),
  rep(3, 'Martín', { activo: false, sucursalId: 2, sucursal: norte }),
  rep(4, 'Diego', { email: 'dr@otro.com' }),
]

describe('filtros de repartidores', () => {
  test('búsqueda por nombre, apellido o email', () => {
    const ids = (busqueda: string) => filtrarRepartidores(lista, { busqueda, sucursalId: null, estado: 'todos' }).map((r) => r.id)
    expect(ids('luc')).toEqual([2])
    expect(ids('pérez')).toEqual([1, 2, 3, 4])
    expect(ids('otro.com')).toEqual([4])
    expect(nombreCompleto(lista[0])).toBe('Carlos Pérez')
  })

  test('estado y sucursal (solo MASTER)', () => {
    const ids = (estado: 'todos' | 'activos' | 'inactivos' | 'enViaje', sucursalId: number | null = null) =>
      filtrarRepartidores(lista, { busqueda: '', sucursalId, estado }).map((r) => r.id)
    expect(ids('activos')).toEqual([1, 2, 4])
    expect(ids('inactivos')).toEqual([3])
    expect(ids('enViaje')).toEqual([2])
    expect(ids('todos', 2)).toEqual([3])
    expect(coincideEstadoRepartidor(lista[1], 'enViaje')).toBe(true)
  })

  test('contadores sobre la búsqueda y la sucursal', () => {
    expect(contarPorEstadoRepartidor(lista, { busqueda: '', sucursalId: null })).toEqual({ todos: 4, activos: 3, inactivos: 1, enViaje: 1 })
    expect(contarPorEstadoRepartidor(lista, { busqueda: '', sucursalId: 1 })).toEqual({ todos: 3, activos: 3, inactivos: 0, enViaje: 1 })
  })

  test('sucursales del filtro del MASTER: las de la lista, sin repetir y ordenadas (D-R1)', () => {
    expect(sucursalesDeLaLista(lista)).toEqual([centro, norte])
    expect(sucursalesDeLaLista([])).toEqual([])
  })
})

describe('acciones y paginación', () => {
  test('con viaje en curso se bloquean editar, desactivar y dar de baja (D-R3)', () => {
    expect(accionesBloqueadas(lista[1])).toBe(true)
    expect(accionesBloqueadas(lista[0])).toBe(false)
  })

  test('10 por página (D-R5)', () => {
    expect(POR_PAGINA_REPARTIDORES).toBe(10)
    expect(paginar(Array.from({ length: 23 }), 1, POR_PAGINA_REPARTIDORES).totalPaginas).toBe(3)
  })
})
