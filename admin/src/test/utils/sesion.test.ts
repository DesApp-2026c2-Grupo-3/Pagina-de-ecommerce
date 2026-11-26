import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  CLAVE_SESION,
  CLAVE_TOKEN,
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  leerSesion,
  leerToken,
  limpiarSesion,
  notificarSesionExpirada,
} from '../../utils/sesion'
import type { AdministradorSesion } from '../../types/sesion.types'

const ADMIN_SUCURSAL: AdministradorSesion = {
  id: 3,
  nombre: 'Marta',
  email: 'marta@burgerfast.com',
  rol: 'ADMIN',
  sucursalId: 2,
  sucursal: { id: 2, nombre: 'Centro' },
}

const MASTER: AdministradorSesion = {
  id: 1,
  nombre: 'Admin',
  email: 'master@burgerfast.com',
  rol: 'MASTER',
  sucursalId: null,
  sucursal: null,
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('guardarSesion y leerSesion', () => {
  test('guarda la sesión de un administrador de sucursal y la vuelve a leer', () => {
    guardarSesion(ADMIN_SUCURSAL, 'abc123')

    expect(leerSesion()).toEqual(ADMIN_SUCURSAL)
    expect(leerToken()).toBe('abc123')
  })

  test('el MASTER no tiene sucursal (sucursalId en null) y su sesión es válida', () => {
    guardarSesion(MASTER, 'abc123')

    expect(leerSesion()).toEqual(MASTER)
  })

  test('no guarda una sesión sin token', () => {
    expect(() => guardarSesion(ADMIN_SUCURSAL, '   ')).toThrow('La sesión no tiene un token válido')
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  test('limpiarSesion borra el administrador y el token', () => {
    guardarSesion(ADMIN_SUCURSAL, 'abc123')

    limpiarSesion()

    expect(leerSesion()).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})

describe('leerSesion con datos incompletos o dañados', () => {
  test('sin nada guardado no hay sesión', () => {
    expect(leerSesion()).toBeNull()
  })

  test('sin token no hay sesión, aunque esté el administrador', () => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(ADMIN_SUCURSAL))

    expect(leerSesion()).toBeNull()
  })

  test('un token vacío cuenta como que no hay token', () => {
    localStorage.setItem(CLAVE_TOKEN, '   ')

    expect(leerToken()).toBeNull()
  })

  test.each([
    ['sin id', { nombre: 'Marta', sucursalId: 2 }],
    ['sin sucursalId', { id: 3, nombre: 'Marta' }],
    ['guardado como null', null],
  ])('descarta un administrador %s', (_, guardado) => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(guardado))
    localStorage.setItem(CLAVE_TOKEN, 'abc123')

    expect(leerSesion()).toBeNull()
  })

  test('descarta un JSON roto', () => {
    localStorage.setItem(CLAVE_SESION, '{ esto no es json')
    localStorage.setItem(CLAVE_TOKEN, 'abc123')

    expect(leerSesion()).toBeNull()
  })
})

describe('notificarSesionExpirada', () => {
  test('con una sesión abierta, avisa a la app que la sesión venció', () => {
    guardarSesion(ADMIN_SUCURSAL, 'abc123')
    const oyente = vi.fn()
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente)

    notificarSesionExpirada()

    expect(oyente).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente)
  })

  test('no borra la sesión por su cuenta: eso lo hace la app al recibir el aviso', () => {
    guardarSesion(ADMIN_SUCURSAL, 'abc123')

    notificarSesionExpirada()

    expect(leerSesion()).toEqual(ADMIN_SUCURSAL)
  })

  test('sin sesión abierta no avisa nada', () => {
    const oyente = vi.fn()
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente)

    notificarSesionExpirada()

    expect(oyente).not.toHaveBeenCalled()
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente)
  })
})