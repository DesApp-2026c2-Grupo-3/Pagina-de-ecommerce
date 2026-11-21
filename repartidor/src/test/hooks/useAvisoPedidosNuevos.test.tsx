import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'

import { useAvisoPedidosNuevos } from '../../hooks/useAvisoPedidosNuevos'
import { ToastProvider } from '../../context/toasts/ToastProvider'
import ContenedorToasts from '../../components/toasts/ContenedorToasts'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import type { AccionRefresco, DominioRefresco } from '../../types/realtime.types'

const YO = 3

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

let irA: (ruta: string) => void = () => {}

function Escucha({ puedeTomar }: { puedeTomar: boolean }) {
  useAvisoPedidosNuevos({ puedeTomar, repartidorId: YO })
  const navigate = useNavigate()

  // El test navega desde afuera: se le pasa la función después de dibujar
  useEffect(() => {
    irA = navigate
  }, [navigate])

  return null
}

function montar(rutaInicial = '/', { puedeTomar = true } = {}) {
  const { Proveedor, emitir } = crearRealtimeDePrueba()
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Proveedor>
        <ToastProvider>
          <Escucha puedeTomar={puedeTomar} />
          <Routes>
            <Route path="/" element={<p>Pantalla: inicio</p>} />
            <Route path="/historial" element={<p>Pantalla: historial</p>} />
            <Route path="/pedidos" element={<p>Pantalla: pedidos</p>} />
          </Routes>
          <ContenedorToasts />
        </ToastProvider>
      </Proveedor>
    </MemoryRouter>,
  )

  let numero = 0
  const refresco = (
    pedidoId: number,
    accion: AccionRefresco = 'creado',
    dominio: DominioRefresco = 'pedidos_disponibles',
    origenRepartidorId?: number,
  ) =>
    act(() =>
      emitir({
        tipo: 'repartidor:refresco',
        payload: {
          version: 1, eventoId: `e${++numero}`, dominio, accion, ocurridoEn: '2026-11-18T03:00:00.000Z',
          sucursalId: 2, recursos: { pedidoId }, origenRepartidorId,
        },
      }),
    )

  return { refresco }
}

// Pasa la espera que agrupa la tanda
const esperarTanda = () => act(() => vi.advanceTimersByTimeAsync(1000))

describe('useAvisoPedidosNuevos (v1.6 y v1.7)', () => {
  test('un pedido nuevo: toast con el número y "Ver pedidos"', async () => {
    const { refresco } = montar()
    refresco(45)
    await esperarTanda()

    expect(screen.getByRole('status')).toHaveTextContent('Nuevo pedido para tomar')
    expect(screen.getByRole('status')).toHaveTextContent('El pedido #45 está listo para retirar.')
  })

  test('varios casi juntos: un solo toast agrupado', async () => {
    const { refresco } = montar()
    refresco(45)
    refresco(46)
    refresco(47)
    await esperarTanda()

    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Hay 3 pedidos nuevos para tomar')
  })

  test('si llegan más mientras se ve, se suman al mismo toast', async () => {
    const { refresco } = montar()
    refresco(45)
    await esperarTanda()
    refresco(46)
    await esperarTanda()

    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Hay 2 pedidos nuevos para tomar')
  })

  test('con un viaje en curso no avisa (no podría tomarlos)', async () => {
    const { refresco } = montar('/', { puedeTomar: false })
    refresco(45)
    await esperarTanda()

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('en Pedidos no avisa: la lista ya se actualiza sola', async () => {
    const { refresco } = montar('/pedidos')
    refresco(45)
    await esperarTanda()

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('otros refrescos (pedido tomado o cancelado, cambios del viaje) no avisan', async () => {
    const { refresco } = montar()
    refresco(45, 'eliminado')
    refresco(46, 'creado', 'viaje')
    await esperarTanda()

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('"Ver pedidos" lleva a Pedidos y cierra el toast', async () => {
    const { refresco } = montar()
    refresco(45)
    await esperarTanda()

    fireEvent.click(screen.getByRole('button', { name: 'Ver pedidos' }))

    expect(screen.getByText('Pantalla: pedidos')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  test('el pedido que quitó él mismo no le avisa a él (D-21), pero sí lo de sus compañeros', async () => {
    const { refresco } = montar()
    refresco(45, 'creado', 'pedidos_disponibles', YO)
    await esperarTanda()
    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()

    refresco(46, 'creado', 'pedidos_disponibles', 9)
    await esperarTanda()
    expect(screen.getByRole('status')).toHaveTextContent('El pedido #46 está listo para retirar.')
  })

  test('cambiar de pantalla mientras se agrupa no pierde la tanda (UX-6)', async () => {
    const { refresco } = montar()
    refresco(45)
    act(() => irA('/historial'))
    refresco(46)
    await esperarTanda()

    expect(screen.getByText('Pantalla: historial')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Hay 2 pedidos nuevos para tomar')
  })
})
