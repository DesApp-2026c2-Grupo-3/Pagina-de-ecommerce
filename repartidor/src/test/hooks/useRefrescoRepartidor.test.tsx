import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useRefrescoRepartidor } from '../../hooks/useRefrescoRepartidor'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import type { EventoRefrescoRepartidor } from '../../types/realtime.types'

const refresco = (eventoId: string, dominio: EventoRefrescoRepartidor['dominio'] = 'viaje'): EventoRefrescoRepartidor => ({
  version: 1,
  eventoId,
  dominio,
  accion: 'actualizado',
  ocurridoEn: '2026-11-17T18:00:00.000Z',
  sucursalId: 2,
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function montar() {
  const { Proveedor, emitir } = crearRealtimeDePrueba()
  const alRefrescar = vi.fn()
  renderHook(() => useRefrescoRepartidor('viaje', alRefrescar), { wrapper: Proveedor })
  return { emitir, alRefrescar }
}

describe('useRefrescoRepartidor', () => {
  test('al volver la app a primer plano recarga (W-1)', () => {
    const { emitir, alRefrescar } = montar()

    act(() => emitir({ tipo: 'visible' }))
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('"visible" y "reconexion" juntos generan una sola recarga', () => {
    const { emitir, alRefrescar } = montar()

    act(() => {
      emitir({ tipo: 'visible' })
      emitir({ tipo: 'reconexion' })
    })
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('un refresco de su dominio recarga; el mismo evento dos veces, una sola vez', () => {
    const { emitir, alRefrescar } = montar()

    act(() => emitir({ tipo: 'repartidor:refresco', payload: refresco('e1') }))
    act(() => vi.advanceTimersByTime(300))
    act(() => emitir({ tipo: 'repartidor:refresco', payload: refresco('e1') }))
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('un refresco de otro dominio no recarga', () => {
    const { emitir, alRefrescar } = montar()

    act(() => emitir({ tipo: 'repartidor:refresco', payload: refresco('e2', 'pedidos_disponibles') }))
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).not.toHaveBeenCalled()
  })
})

describe('useRefrescoRepartidor con varios dominios (v1.7)', () => {
  const DOMINIOS = ['pedidos_disponibles', 'viaje'] as const

  test('cualquiera de los dominios recarga, y juntos cuentan como una sola recarga', () => {
    const { Proveedor, emitir } = crearRealtimeDePrueba()
    const alRefrescar = vi.fn()
    renderHook(() => useRefrescoRepartidor(DOMINIOS, alRefrescar), { wrapper: Proveedor })

    act(() => {
      emitir({ tipo: 'repartidor:refresco', payload: refresco('a', 'pedidos_disponibles') })
      emitir({ tipo: 'repartidor:refresco', payload: refresco('b', 'viaje') })
      emitir({ tipo: 'visible' })
    })
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })
})
