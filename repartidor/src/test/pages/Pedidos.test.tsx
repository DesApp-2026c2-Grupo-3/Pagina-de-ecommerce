import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Pedidos from '../../pages/Pedidos/Pedidos'
import { ToastProvider } from '../../context/toasts/ToastProvider'
import ContenedorToasts from '../../components/toasts/ContenedorToasts'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import { pedido } from '../fixturesPedidos'
import { obtenerPedidosDisponibles } from '../../services/pedidoService'
import { tomarPedidos } from '../../services/viajeService'

vi.mock('../../services/pedidoService', () => ({ obtenerPedidosDisponibles: vi.fn() }))
vi.mock('../../services/viajeService', () => ({ tomarPedidos: vi.fn() }))

beforeEach(() => {
  vi.mocked(obtenerPedidosDisponibles).mockResolvedValue([pedido(45), pedido(46)])
})

afterEach(() => {
  vi.clearAllMocks()
})

function montar() {
  const { Proveedor } = crearRealtimeDePrueba()
  render(
    <MemoryRouter initialEntries={['/pedidos']}>
      <Proveedor>
        <ToastProvider>
          <Routes>
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/viaje" element={<p>Pantalla: viaje</p>} />
          </Routes>
          <ContenedorToasts />
        </ToastProvider>
      </Proveedor>
    </MemoryRouter>,
  )
}

async function seleccionarPrimero() {
  const [primero] = await screen.findAllByRole('button', { name: 'Seleccionar pedido' })
  await userEvent.click(primero)
}

describe('Pedidos: tomar pedidos (UX-5)', () => {
  test('seleccionar es un botón de alternar y aparece la barra con la cantidad', async () => {
    montar()
    await seleccionarPrimero()

    expect(screen.getByRole('button', { name: 'Quitar de la selección' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tomar pedidos (1)' })).toBeInTheDocument()
  })

  test('al tomarlos va a Mi viaje, sin toast de confirmación (v1.6)', async () => {
    vi.mocked(tomarPedidos).mockResolvedValue({ mensaje: 'ok', viaje: { id: 90, repartidorId: 7, fechaInicio: null, estado: 'preparando' }, pedidoIds: [45] })
    montar()
    await seleccionarPrimero()

    await userEvent.click(screen.getByRole('button', { name: 'Tomar pedidos (1)' }))

    expect(tomarPedidos).toHaveBeenCalledWith([45])
    expect(await screen.findByText('Pantalla: viaje')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('si falla: toast de error con el motivo del servidor y se queda en la pantalla', async () => {
    vi.mocked(tomarPedidos).mockRejectedValue(new Error('Otro repartidor ya tomó el pedido #45.'))
    montar()
    await seleccionarPrimero()

    await userEvent.click(screen.getByRole('button', { name: 'Tomar pedidos (1)' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No se pudieron tomar los pedidos')
    expect(alerta).toHaveTextContent('Otro repartidor ya tomó el pedido #45.')
    expect(screen.queryByText('Pantalla: viaje')).not.toBeInTheDocument()
  })
})
