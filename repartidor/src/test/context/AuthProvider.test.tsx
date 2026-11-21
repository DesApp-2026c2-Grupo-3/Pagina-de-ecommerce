import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { AuthProvider } from '../../context/AuthProvider'
import { useAuth } from '../../context/AuthContext'
import { iniciarSesion, obtenerSesion } from '../../services/authService'
import { ErrorApi, suscribirSesionExpirada } from '../../services/httpClient'
import { desconectarSocketRepartidor } from '../../realtime/socketClient'
import { limpiarBusRealtime } from '../../realtime/realtimeBus'
import { guardarSesion, leerSesion } from '../../utils/sesion'
import type { Repartidor } from '../../types/repartidor.types'

vi.mock('../../services/authService', () => ({ iniciarSesion: vi.fn(), obtenerSesion: vi.fn() }))
vi.mock('../../realtime/socketClient', () => ({ desconectarSocketRepartidor: vi.fn() }))
vi.mock('../../realtime/realtimeBus', () => ({ limpiarBusRealtime: vi.fn() }))
// Se usa el ErrorApi real; solo se reemplaza la suscripción para poder disparar un 401 a mano
vi.mock('../../services/httpClient', async (original) => ({
  ...(await original<typeof import('../../services/httpClient')>()),
  suscribirSesionExpirada: vi.fn(() => () => {}),
}))

const REPARTIDOR: Repartidor = {
  id: 4,
  nombre: 'Lucas',
  apellido: 'Gómez',
  email: 'lucas@burgerfast.com',
  sucursalId: 2,
}

const envoltorio = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>
const montar = () => renderHook(() => useAuth(), { wrapper: envoltorio })

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('al abrir la app', () => {
  test('sin sesión guardada no consulta al servidor', () => {
    const { result } = montar()

    expect(result.current.repartidor).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.cargando).toBe(false)
    expect(obtenerSesion).not.toHaveBeenCalled()
  })

  test('con sesión guardada, la revalida y actualiza los datos del repartidor', async () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })
    vi.mocked(obtenerSesion).mockResolvedValue({ ...REPARTIDOR, nombre: 'Lucas Martín' })

    const { result } = montar()

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.token).toBe('abc')
    expect(result.current.repartidor?.nombre).toBe('Lucas Martín')
    expect(leerSesion()?.repartidor.nombre).toBe('Lucas Martín')
  })

  test('si se corta la red al revalidar, conserva la sesión guardada', async () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })
    vi.mocked(obtenerSesion).mockRejectedValue(new Error('sin conexión'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = montar()

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.repartidor).toEqual(REPARTIDOR)
    expect(console.error).toHaveBeenCalled()
  })

  test('un 401 al revalidar no se registra como error (lo resuelve el cierre por sesión vencida)', async () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })
    vi.mocked(obtenerSesion).mockRejectedValue(new ErrorApi('No autorizado', 401))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = montar()

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(console.error).not.toHaveBeenCalled()
  })
})

describe('iniciarSesion', () => {
  test('guarda la sesión y deja al repartidor conectado', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ token: 'nuevo', repartidor: REPARTIDOR })
    const { result } = montar()

    await act(() => result.current.iniciarSesion('lucas@burgerfast.com', 'secreta'))

    expect(iniciarSesion).toHaveBeenCalledWith('lucas@burgerfast.com', 'secreta')
    expect(result.current.token).toBe('nuevo')
    expect(result.current.repartidor).toEqual(REPARTIDOR)
    expect(leerSesion()).toEqual({ token: 'nuevo', repartidor: REPARTIDOR })
  })

  test('rechaza una respuesta del servidor incompleta y no guarda nada', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ token: 'nuevo', repartidor: { id: 4 } } as never)
    const { result } = montar()

    await expect(act(() => result.current.iniciarSesion('a@b.com', 'x'))).rejects.toThrow(
      'Respuesta de inicio de sesión inválida',
    )
    expect(result.current.token).toBeNull()
    expect(leerSesion()).toBeNull()
  })

  test('si las credenciales son incorrectas, propaga el error', async () => {
    vi.mocked(iniciarSesion).mockRejectedValue(new ErrorApi('Email o contraseña incorrectos', 401))
    const { result } = montar()

    await expect(act(() => result.current.iniciarSesion('a@b.com', 'x'))).rejects.toThrow(
      'Email o contraseña incorrectos',
    )
    expect(result.current.repartidor).toBeNull()
  })

  test('al volver a entrar, borra el motivo del cierre anterior', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ token: 'nuevo', repartidor: REPARTIDOR })
    const { result } = montar()

    act(() => result.current.cerrarSesion('desactivado'))
    expect(result.current.motivoCierre).toBe('desactivado')

    await act(() => result.current.iniciarSesion('lucas@burgerfast.com', 'secreta'))

    expect(result.current.motivoCierre).toBeNull()
  })
})

describe('cerrarSesion (RN-55: cuenta inactiva en el momento)', () => {
  test('desconecta el socket, limpia los avisos y borra la sesión', () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })
    vi.mocked(obtenerSesion).mockReturnValue(new Promise(() => {}))
    const { result } = montar()

    act(() => result.current.cerrarSesion())

    expect(desconectarSocketRepartidor).toHaveBeenCalled()
    expect(limpiarBusRealtime).toHaveBeenCalled()
    expect(leerSesion()).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.repartidor).toBeNull()
    expect(result.current.cargando).toBe(false)
    expect(result.current.motivoCierre).toBeNull()
  })

  test.each(['desactivado', 'baja', 'asistencia'] as const)(
    'guarda el motivo "%s" para mostrarlo en el inicio de sesión',
    (motivo) => {
      const { result } = montar()

      act(() => result.current.cerrarSesion(motivo))

      expect(result.current.motivoCierre).toBe(motivo)
    },
  )

  test('si el servidor responde 401 (sesión vencida), cierra la sesión con ese motivo', () => {
    guardarSesion({ token: 'abc', repartidor: REPARTIDOR })
    vi.mocked(obtenerSesion).mockReturnValue(new Promise(() => {}))
    const { result } = montar()
    const alExpirar = vi.mocked(suscribirSesionExpirada).mock.calls.at(-1)![0]

    act(() => alExpirar())

    expect(result.current.token).toBeNull()
    expect(result.current.motivoCierre).toBe('expirada')
  })
})

test('useAuth fuera del AuthProvider avisa el error de uso', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  expect(() => renderHook(() => useAuth())).toThrow('useAuth debe utilizarse dentro de AuthProvider')
})