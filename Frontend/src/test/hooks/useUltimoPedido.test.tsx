import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useUltimoPedido } from '../../hooks/useUltimoPedido'
import { RealtimeContext } from '../../context/realtime/RealtimeContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import { getHistorialPedidos } from '../../services/orderService'
import { useAuth } from '../../context/AuthContext'
import type { Order } from '../../types/order'

vi.mock('../../services/orderService', () => ({ getHistorialPedidos: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
const obtener = vi.mocked(getHistorialPedidos)
const auth = vi.mocked(useAuth)

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

const pedido = (id: number, fecha: string) => ({ id, fecha }) as Order
const conSesion = () => auth.mockReturnValue({ user: { id: 7 } } as unknown as ReturnType<typeof useAuth>)

afterEach(() => {
  vi.clearAllMocks()
  limpiarBusRealtime()
})

describe('useUltimoPedido (C-7)', () => {
  test('devuelve el pedido más reciente y lo recarga con un refresco de pedido', async () => {
    conSesion()
    obtener
      .mockResolvedValueOnce([pedido(1, '2026-11-18T10:00:00Z'), pedido(2, '2026-11-19T10:00:00Z')])
      .mockResolvedValueOnce([pedido(3, '2026-11-19T12:00:00Z'), pedido(2, '2026-11-19T10:00:00Z')])
    const { result } = renderHook(() => useUltimoPedido(), { wrapper: Proveedor })

    await waitFor(() => expect(result.current?.id).toBe(2))

    act(() =>
      publicarEventoRealtime({
        tipo: 'cliente:refresco',
        refresco: { eventoId: 'e1', dominio: 'pedido', accion: 'creado', sucursalId: null, pedidoId: 3 },
      }),
    )

    await waitFor(() => expect(result.current?.id).toBe(3), { timeout: 2000 })
    expect(obtener).toHaveBeenCalledTimes(2)
  })

  test('sin pedidos o con error no muestra nada', async () => {
    conSesion()
    obtener.mockRejectedValueOnce(new Error('Sin conexión'))
    const { result } = renderHook(() => useUltimoPedido(), { wrapper: Proveedor })

    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(1))
    expect(result.current).toBeNull()
  })

  test('sin sesión no carga nada', () => {
    auth.mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuth>)
    const { result } = renderHook(() => useUltimoPedido(), { wrapper: Proveedor })

    expect(obtener).not.toHaveBeenCalled()
    expect(result.current).toBeNull()
  })
})
