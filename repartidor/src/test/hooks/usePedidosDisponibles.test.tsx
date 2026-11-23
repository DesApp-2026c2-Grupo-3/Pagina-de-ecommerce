import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { usePedidosDisponibles } from '../../hooks/usePedidosDisponibles'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import { obtenerPedidosDisponibles } from '../../services/pedidoService'

vi.mock('../../services/pedidoService', () => ({
  obtenerPedidosDisponibles: vi.fn(),
}))
vi.mock('../../services/viajeService', () => ({
  tomarPedidos: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(obtenerPedidosDisponibles).mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
})

function montar() {
  const { Proveedor } = crearRealtimeDePrueba()
  return renderHook(() => usePedidosDisponibles(), { wrapper: Proveedor })
}

describe('usePedidosDisponibles', () => {
  test('arranca cargando y termina con la primera carga', async () => {
    const { result } = montar()

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(obtenerPedidosDisponibles).toHaveBeenCalledTimes(1)
  })

  test('"Actualizar" muestra la carga y vuelve a pedir', async () => {
    const { result } = montar()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    act(() => result.current.recargar())
    expect(result.current.cargando).toBe(true)

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(obtenerPedidosDisponibles).toHaveBeenCalledTimes(2)
  })

  test('si falla, muestra el error y deja de cargar', async () => {
    vi.mocked(obtenerPedidosDisponibles).mockRejectedValue(new Error('red'))
    const { result } = montar()

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.error).toBe('No se pudieron cargar los pedidos disponibles.')
  })
})
