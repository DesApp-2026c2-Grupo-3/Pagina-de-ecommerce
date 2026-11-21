import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useHistorialViajes } from '../../hooks/useHistorialViajes'
import { obtenerHistorialViajes } from '../../services/viajeService'
import type { ViajeHistorial } from '../../types/viaje.types'

vi.mock('../../services/viajeService', () => ({ obtenerHistorialViajes: vi.fn() }))

const VIAJE: ViajeHistorial = { id: 80, repartidorId: 7, fechaInicio: null, fechaFin: null, estado: 'finalizado', Pedidos: [] }

afterEach(() => {
  vi.clearAllMocks()
})

describe('useHistorialViajes', () => {
  test('arranca cargando y después trae los viajes', async () => {
    vi.mocked(obtenerHistorialViajes).mockResolvedValue([VIAJE])
    const { result } = renderHook(() => useHistorialViajes())

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.viajes).toEqual([VIAJE])
    expect(result.current.error).toBe('')
  })

  test('si falla, deja el mensaje de error', async () => {
    vi.mocked(obtenerHistorialViajes).mockRejectedValue(new Error('red'))
    const { result } = renderHook(() => useHistorialViajes())

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.error).toBe('No se pudo cargar el historial de viajes.')
  })
})
