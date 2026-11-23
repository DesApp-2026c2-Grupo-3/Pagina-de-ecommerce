import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  CLAVE_TOKEN,
  CLAVE_USUARIO,
  guardarSesion,
  leerSesion,
  leerToken,
  limpiarSesion,
} from '../../utils/sesion'
import type { User } from '../../types/user'

const USUARIO: User = { id: 7, name: 'Ana', email: 'ana@mail.com' }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('guardarSesion y leerSesion', () => {
  test('guarda el usuario y el token, y los vuelve a leer', () => {
    guardarSesion({ user: USUARIO, token: 'abc123' })

    expect(leerSesion()).toEqual({ user: USUARIO, token: 'abc123' })
  })

  test('guarda el token sin espacios', () => {
    guardarSesion({ user: USUARIO, token: '  abc123  ' })

    expect(localStorage.getItem(CLAVE_TOKEN)).toBe('abc123')
  })

  test('no guarda una sesión sin token', () => {
    expect(() => guardarSesion({ user: USUARIO, token: '   ' })).toThrow('La sesión no tiene un token válido')
    expect(localStorage.getItem(CLAVE_USUARIO)).toBeNull()
  })
})

describe('leerSesion con datos incompletos o dañados', () => {
  test('sin nada guardado no hay sesión', () => {
    expect(leerSesion()).toBeNull()
  })

  test('con usuario pero sin token, limpia lo guardado', () => {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(USUARIO))

    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE_USUARIO)).toBeNull()
  })

  test('con token pero sin usuario, limpia lo guardado', () => {
    localStorage.setItem(CLAVE_TOKEN, 'abc123')

    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE_TOKEN)).toBeNull()
  })

  test.each([
    ['sin id', { name: 'Ana', email: 'ana@mail.com' }],
    ['con id 0', { id: 0, name: 'Ana', email: 'ana@mail.com' }],
    ['con id decimal', { id: 1.5, name: 'Ana', email: 'ana@mail.com' }],
    ['sin email', { id: 7, name: 'Ana' }],
    ['que no es un objeto', 'Ana'],
    ['nulo', null],
  ])('descarta un usuario %s', (_, usuario) => {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
    localStorage.setItem(CLAVE_TOKEN, 'abc123')

    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE_TOKEN)).toBeNull()
  })

  test('descarta un usuario guardado con un JSON roto', () => {
    localStorage.setItem(CLAVE_USUARIO, '{ esto no es json')
    localStorage.setItem(CLAVE_TOKEN, 'abc123')

    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE_USUARIO)).toBeNull()
  })
})

describe('leerToken', () => {
  test('devuelve el token guardado', () => {
    localStorage.setItem(CLAVE_TOKEN, 'abc123')

    expect(leerToken()).toBe('abc123')
  })

  test('un token vacío cuenta como que no hay token', () => {
    localStorage.setItem(CLAVE_TOKEN, '   ')

    expect(leerToken()).toBeNull()
  })

  test('si el navegador bloquea el almacenamiento, no hay token', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Almacenamiento bloqueado')
    })

    expect(leerToken()).toBeNull()
  })
})

describe('limpiarSesion', () => {
  test('borra el usuario y el token', () => {
    guardarSesion({ user: USUARIO, token: 'abc123' })

    limpiarSesion()

    expect(localStorage.getItem(CLAVE_USUARIO)).toBeNull()
    expect(localStorage.getItem(CLAVE_TOKEN)).toBeNull()
  })

  test('no falla si el navegador bloquea el almacenamiento', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Almacenamiento bloqueado')
    })

    expect(() => limpiarSesion()).not.toThrow()
  })
})