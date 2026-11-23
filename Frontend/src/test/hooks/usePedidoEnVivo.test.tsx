import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { usePedidoEnVivo } from '../../hooks/usePedidoEnVivo'
import { RealtimeContext } from '../../context/realtime/RealtimeContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import { getPedidoCliente } from '../../services/orderService'
import type { Order } from '../../types/order'

vi.mock('../../services/orderService', () => ({ getPedidoCliente: vi.fn() }))
const obtener = vi.mocked(getPedidoCliente)

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

const pedido = (estado: string) => ({ id: 45, estado }) as Order

const refrescoDe = (pedidoId: number, eventoId: string) =>
  act(() =>
    publicarEventoRealtime({
      tipo: 'cliente:refresco',
      refresco: { eventoId, dominio: 'pedido', accion: 'estado_cambiado', sucursalId: null, pedidoId },
    }),
  )

afterEach(() => {
  vi.clearAllMocks()
  limpiarBusRealtime()
})

describe('usePedidoEnVivo (C-6)', () => {
  test('carga el pedido y lo recarga del servidor con cada refresco de ese pedido', async () => {
    obtener.mockResolvedValueOnce(pedido('Pendiente')).mockResolvedValueOnce(pedido('En camino'))
    const { result } = renderHook(() => usePedidoEnVivo(45), { wrapper: Proveedor })

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.pedido?.estado).toBe('Pendiente'))

    refrescoDe(46, 'otro')
    refrescoDe(45, 'propio')

    await waitFor(() => expect(result.current.pedido?.estado).toBe('En camino'), { timeout: 2000 })
    expect(obtener).toHaveBeenCalledTimes(2)
    expect(obtener).toHaveBeenLastCalledWith(45)
  })

  test('si falla la primera carga, muestra el error', async () => {
    obtener.mockRejectedValueOnce(new Error('Pedido no encontrado'))
    const { result } = renderHook(() => usePedidoEnVivo(45), { wrapper: Proveedor })

    await waitFor(() => expect(result.current.error).toBe('Pedido no encontrado'))
    expect(result.current.cargando).toBe(false)
    expect(result.current.pedido).toBeNull()
  })

  test('si falla una recarga, queda el último pedido cargado', async () => {
    obtener.mockResolvedValueOnce(pedido('Pendiente')).mockRejectedValueOnce(new Error('Sin conexión'))
    const { result } = renderHook(() => usePedidoEnVivo(45), { wrapper: Proveedor })
    await waitFor(() => expect(result.current.pedido?.estado).toBe('Pendiente'))

    refrescoDe(45, 'propio')
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(2), { timeout: 2000 })

    expect(result.current.pedido?.estado).toBe('Pendiente')
    expect(result.current.error).toBe('')
  })

  test('sin id no carga nada', () => {
    const { result } = renderHook(() => usePedidoEnVivo(null), { wrapper: Proveedor })

    expect(obtener).not.toHaveBeenCalled()
    expect(result.current).toEqual({ pedido: null, error: '', cargando: false })
  })
})
