import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'

import { usePedidosParaTomar } from '../../hooks/usePedidosParaTomar'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import { pedido } from '../fixturesPedidos'
import { obtenerPedidosDisponibles } from '../../services/pedidoService'
import { obtenerViajeActivo } from '../../services/viajeService'
import type { ViajeActivo } from '../../types/viaje.types'

vi.mock('../../services/pedidoService', () => ({ obtenerPedidosDisponibles: vi.fn() }))
vi.mock('../../services/viajeService', () => ({ obtenerViajeActivo: vi.fn() }))

const VIAJE = { id: 87, estado: 'preparando' } as ViajeActivo

beforeEach(() => {
  vi.mocked(obtenerViajeActivo).mockResolvedValue(null)
  vi.mocked(obtenerPedidosDisponibles).mockResolvedValue([pedido(45), pedido(46)])
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

let irA: (ruta: string) => void = () => {}

function Contador() {
  const cantidad = usePedidosParaTomar()
  const navigate = useNavigate()

  // El test navega desde afuera: se le pasa la función después de dibujar
  useEffect(() => {
    irA = navigate
  }, [navigate])

  return <p>para tomar: {cantidad === null ? 'oculto' : cantidad}</p>
}

function montar() {
  const { Proveedor, emitir } = crearRealtimeDePrueba()
  render(
    <MemoryRouter initialEntries={['/']}>
      <Proveedor>
        <Contador />
      </Proveedor>
    </MemoryRouter>,
  )
  return { emitir }
}

const refresco = (dominio: 'pedidos_disponibles' | 'viaje') => ({
  tipo: 'repartidor:refresco' as const,
  payload: {
    version: 1 as const, eventoId: crypto.randomUUID(), dominio, accion: 'creado' as const,
    ocurridoEn: '2026-11-18T03:00:00.000Z', sucursalId: 2,
  },
})

describe('usePedidosParaTomar (v1.7)', () => {
  test('sin viaje en curso: cuántos pedidos hay disponibles', async () => {
    montar()

    expect(await screen.findByText('para tomar: 2')).toBeInTheDocument()
  })

  test('con un viaje en curso no se muestra (no puede tomar pedidos)', async () => {
    vi.mocked(obtenerViajeActivo).mockResolvedValue(VIAJE)
    montar()

    await act(async () => {})
    expect(screen.getByText('para tomar: oculto')).toBeInTheDocument()
  })

  test('cuando cambian los disponibles, se actualiza (p. ej. un compañero tomó uno)', async () => {
    vi.useFakeTimers()
    const { emitir } = montar()
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByText('para tomar: 2')).toBeInTheDocument()

    vi.mocked(obtenerPedidosDisponibles).mockResolvedValue([pedido(46)])
    act(() => emitir(refresco('pedidos_disponibles')))
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(screen.getByText('para tomar: 1')).toBeInTheDocument()
  })

  test('si le asignan un viaje, el contador se oculta', async () => {
    vi.useFakeTimers()
    const { emitir } = montar()
    await act(() => vi.advanceTimersByTimeAsync(0))

    vi.mocked(obtenerViajeActivo).mockResolvedValue(VIAJE)
    act(() => emitir(refresco('viaje')))
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(screen.getByText('para tomar: oculto')).toBeInTheDocument()
  })

  test('al cambiar de pantalla vuelve a contar (p. ej. después de terminar su viaje)', async () => {
    vi.mocked(obtenerViajeActivo).mockResolvedValue(VIAJE)
    montar()
    await act(async () => {})
    expect(screen.getByText('para tomar: oculto')).toBeInTheDocument()

    vi.mocked(obtenerViajeActivo).mockResolvedValue(null)
    await act(async () => irA('/pedidos'))

    expect(await screen.findByText('para tomar: 2')).toBeInTheDocument()
  })

  test('si falla, conserva el último número conocido', async () => {
    vi.useFakeTimers()
    const { emitir } = montar()
    await act(() => vi.advanceTimersByTimeAsync(0))

    vi.mocked(obtenerPedidosDisponibles).mockRejectedValue(new Error('red'))
    act(() => emitir(refresco('pedidos_disponibles')))
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(screen.getByText('para tomar: 2')).toBeInTheDocument()
  })
})
