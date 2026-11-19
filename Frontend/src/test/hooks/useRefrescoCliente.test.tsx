import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useRefrescoCliente } from '../../hooks/useRefrescoCliente'
import { RealtimeContext } from '../../context/realtime/RealtimeContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import type { RefrescoCliente } from '../../types/realtime.types'

function Proveedor({ children }: { children: ReactNode }) {
  return (
    <RealtimeContext.Provider
      value={{
        estado: { conexion: 'conectado', ultimaConexionEn: null, ultimoError: null },
        suscribir: suscribirEventoRealtime,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

const refresco = (cambios: Partial<RefrescoCliente> = {}): RefrescoCliente => ({
  eventoId: 'e-1',
  dominio: 'pedido',
  accion: 'estado_cambiado',
  sucursalId: null,
  pedidoId: 45,
  ...cambios,
})

const publicar = (r: RefrescoCliente) =>
  act(() => publicarEventoRealtime({ tipo: 'cliente:refresco', refresco: r }))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  limpiarBusRealtime()
})

describe('useRefrescoCliente (C-6)', () => {
  test('agrupa los refrescos que llegan juntos en una sola recarga', () => {
    const alRefrescar = vi.fn()
    renderHook(() => useRefrescoCliente('pedido', alRefrescar), { wrapper: Proveedor })

    publicar(refresco({ eventoId: 'a' }))
    publicar(refresco({ eventoId: 'b' }))
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('un evento repetido no vuelve a recargar', () => {
    const alRefrescar = vi.fn()
    renderHook(() => useRefrescoCliente('pedido', alRefrescar), { wrapper: Proveedor })

    publicar(refresco())
    act(() => vi.advanceTimersByTime(300))
    publicar(refresco())
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('ignora otros dominios y lo que no coincide', () => {
    const alRefrescar = vi.fn()
    renderHook(
      () => useRefrescoCliente('pedido', alRefrescar, (r) => r.pedidoId === 45),
      { wrapper: Proveedor },
    )

    publicar(refresco({ eventoId: 'a', dominio: 'sucursal', pedidoId: null, sucursalId: 2 }))
    publicar(refresco({ eventoId: 'b', pedidoId: 46 }))
    act(() => vi.advanceTimersByTime(300))
    expect(alRefrescar).not.toHaveBeenCalled()

    publicar(refresco({ eventoId: 'c', pedidoId: 45 }))
    act(() => vi.advanceTimersByTime(300))
    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('al reconectar o volver a la pestaña revalida una sola vez', () => {
    const alRefrescar = vi.fn()
    renderHook(() => useRefrescoCliente('sucursal', alRefrescar), { wrapper: Proveedor })

    act(() => {
      publicarEventoRealtime({ tipo: 'visible' })
      publicarEventoRealtime({ tipo: 'reconexion' })
    })
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).toHaveBeenCalledTimes(1)
  })

  test('al desmontar deja de escuchar', () => {
    const alRefrescar = vi.fn()
    const { unmount } = renderHook(() => useRefrescoCliente('pedido', alRefrescar), { wrapper: Proveedor })

    publicar(refresco())
    unmount()
    act(() => vi.advanceTimersByTime(300))

    expect(alRefrescar).not.toHaveBeenCalled()
  })
})
