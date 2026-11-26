import { beforeEach, describe, expect, test } from 'vitest'

import {
  esRepartidor,
  esSesionRepartidor,
  guardarRepartidor,
  guardarSesion,
  leerSesion,
  leerToken,
  limpiarSesion,
} from '../../utils/sesion'
import type { Repartidor } from '../../types/repartidor.types'

const REPARTIDOR: Repartidor = {
  id: 4,
  nombre: 'Lucas',
  apellido: 'Gómez',
  email: 'lucas@burgerfast.com',
  sucursalId: 2,
  Sucursal: { id: 2, nombre: 'Centro' },
}

beforeEach(() => {
  localStorage.clear()
})

describe('esRepartidor', () => {
  test('acepta un repartidor completo', () => {
    expect(esRepartidor(REPARTIDOR)).toBe(true)
  })

  test('la sucursal es opcional', () => {
    const { Sucursal, ...sinSucursal } = REPARTIDOR

    expect(Sucursal).toBeDefined()
    expect(esRepartidor(sinSucursal)).toBe(true)
  })

  test.each([
    ['sin id', { ...REPARTIDOR, id: undefined }],
    ['con id 0', { ...REPARTIDOR, id: 0 }],
    ['con id como texto', { ...REPARTIDOR, id: '4' }],
    ['sin apellido', { ...REPARTIDOR, apellido: undefined }],
    ['sin sucursal asignada', { ...REPARTIDOR, sucursalId: null }],
    ['con una sucursal incompleta', { ...REPARTIDOR, Sucursal: { id: 2 } }],
    ['que es una lista', [REPARTIDOR]],
    ['nulo', null],
  ])('rechaza un repartidor %s', (_, valor) => {
    expect(esRepartidor(valor)).toBe(false)
  })
})

describe('esSesionRepartidor', () => {
  test('acepta una sesión con token y repartidor', () => {
    expect(esSesionRepartidor({ token: 'abc', repartidor: REPARTIDOR })).toBe(true)
  })

  test.each([
    ['sin token', { repartidor: REPARTIDOR }],
    ['con el token vacío', { token: '   ', repartidor: REPARTIDOR }],
    ['con un repartidor inválido', { token: 'abc', repartidor: { id: 4 } }],
    ['que no es un objeto', 'abc'],
  ])('rechaza una sesión %s', (_, valor) => {
    expect(esSesionRepartidor(valor)).toBe(false)
  })
})

describe('guardar y leer la sesión', () => {
  test('guarda la sesión y la vuelve a leer', () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })

    expect(leerSesion()).toEqual({ token: 'abc', repartidor: REPARTIDOR })
  })

  test('guarda el token sin espacios', () => {
    guardarSesion({ token: '  abc  ', repartidor: REPARTIDOR })

    expect(leerToken()).toBe('abc')
  })

  test('actualiza solo los datos del repartidor y conserva el token', () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })

    guardarRepartidor({ ...REPARTIDOR, nombre: 'Lucas Martín' })

    expect(leerSesion()).toEqual({ token: 'abc', repartidor: { ...REPARTIDOR, nombre: 'Lucas Martín' } })
  })

  test('limpiarSesion borra todo', () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })

    limpiarSesion()

    expect(leerSesion()).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})

describe('leerSesion con datos incompletos o dañados', () => {
  test('sin nada guardado no hay sesión', () => {
    expect(leerSesion()).toBeNull()
  })

  test('un token vacío cuenta como que no hay token', () => {
    localStorage.setItem('token', '   ')

    expect(leerToken()).toBeNull()
  })

  test('con token pero sin repartidor, limpia lo guardado', () => {
    localStorage.setItem('token', 'abc')

    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('con repartidor pero sin token, limpia lo guardado', () => {
    localStorage.setItem('repartidor', JSON.stringify(REPARTIDOR))

    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem('repartidor')).toBeNull()
  })

  test('con un repartidor inválido, limpia lo guardado', () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('repartidor', JSON.stringify({ id: 4, nombre: 'Lucas' }))

    expect(leerSesion()).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  test('con un JSON roto, limpia lo guardado', () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('repartidor', '{ esto no es json')

    expect(leerSesion()).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})