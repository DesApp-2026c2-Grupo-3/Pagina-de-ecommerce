import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { DEMORA_FRANJA_MS, DURACION_VOLVIO_MS, useEstadoConexion } from '../../hooks/useEstadoConexion'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import type { EstadoRealtime } from '../../types/realtime.types'

function fijarRed(enLinea: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: enLinea, configurable: true })
  window.dispatchEvent(new Event(enLinea ? 'online' : 'offline'))
}

beforeEach(() => {
  vi.useFakeTimers()
  fijarRed(true)
})

afterEach(() => {
  vi.useRealTimers()
  fijarRed(true)
})

function montar(inicial: EstadoRealtime) {
  const { Proveedor } = crearRealtimeDePrueba()
  let estado = inicial
  const wrapper = ({ children }: { children: ReactNode }) => <Proveedor estado={estado}>{children}</Proveedor>
  const resultado = renderHook(() => useEstadoConexion(), { wrapper })
  const cambiar = (nuevo: EstadoRealtime) => {
    estado = nuevo
    resultado.rerender()
  }
  return { ...resultado, cambiar }
}

describe('useEstadoConexion', () => {
  test('conectado: en línea y sin franja', () => {
    const { result } = montar('conectado')

    expect(result.current).toEqual({ estado: 'en_linea', franja: 'oculta' })
  })

  test('mapea los estados del socket', () => {
    expect(montar('conectando').result.current.estado).toBe('conectando')
    expect(montar('reconectando').result.current.estado).toBe('reconectando')
  })

  test('sin red manda sobre el estado del socket', () => {
    const { result } = montar('conectado')

    act(() => fijarRed(false))

    expect(result.current.estado).toBe('sin_red')
  })

  test('un corte de menos de 3 s no muestra la franja', () => {
    const { result, cambiar } = montar('conectado')

    act(() => cambiar('reconectando'))
    act(() => vi.advanceTimersByTime(DEMORA_FRANJA_MS - 100))
    act(() => cambiar('conectado'))
    act(() => vi.advanceTimersByTime(DEMORA_FRANJA_MS))

    expect(result.current.franja).toBe('oculta')
  })

  test('corte largo: franja a los 3 s; al volver, "volvió" 2 s y se oculta', () => {
    const { result, cambiar } = montar('conectado')

    act(() => cambiar('reconectando'))
    expect(result.current.franja).toBe('oculta')

    act(() => vi.advanceTimersByTime(DEMORA_FRANJA_MS))
    expect(result.current.franja).toBe('reconectando')

    act(() => cambiar('conectado'))
    expect(result.current.franja).toBe('volvio')

    act(() => vi.advanceTimersByTime(DURACION_VOLVIO_MS))
    expect(result.current.franja).toBe('oculta')
  })

  test('sin red, la franja lo dice', () => {
    const { result } = montar('conectado')

    act(() => fijarRed(false))
    act(() => vi.advanceTimersByTime(DEMORA_FRANJA_MS))

    expect(result.current.franja).toBe('sin_red')
  })
})
