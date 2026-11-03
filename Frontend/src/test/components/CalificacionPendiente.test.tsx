import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CalificacionPendiente from '../../components/calificaciones/CalificacionPendiente'
import { getCalificacionPendiente } from '../../services/calificacionService'

vi.mock('../../services/calificacionService', () => ({
  getCalificacionPendiente: vi.fn(),
  calificarPedido: vi.fn(),
}))

let usuario: { id: number } | null = { id: 3 }
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: usuario }) }))

const pendiente = {
  pedidoId: 12,
  fecha: '2026-10-30T18:00:00Z',
  entregadoEn: '2026-10-30T19:00:00Z',
  total: 5400,
  sucursal: { id: 2, nombre: 'Hurlingham' },
  productos: ['Fast Classic'],
}

// Sin espera (retrasoMs=0) y con timers reales
function montar(ruta = '/') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <CalificacionPendiente retrasoMs={0} />
    </MemoryRouter>,
  )
}

// Deja pasar un momento para comprobar que algo NO apareció
const esperarUnMomento = () => new Promise((resolver) => setTimeout(resolver, 30))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  usuario = { id: 3 }
  vi.mocked(getCalificacionPendiente).mockResolvedValue(pendiente)
})

describe('CalificacionPendiente', () => {
  test('ofrece calificar el último pedido', async () => {
    montar()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(getCalificacionPendiente).toHaveBeenCalledWith(3)
  })

  test('no pregunta nada sin sesión iniciada', async () => {
    usuario = null
    montar()
    await esperarUnMomento()
    expect(getCalificacionPendiente).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('no aparece si no hay nada para calificar', async () => {
    vi.mocked(getCalificacionPendiente).mockResolvedValue(null)
    montar()
    await waitFor(() => expect(getCalificacionPendiente).toHaveBeenCalled())
    await esperarUnMomento()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test.each(['/carrito', '/checkout', '/login'])('no interrumpe en %s', async (ruta) => {
    montar(ruta)
    await waitFor(() => expect(getCalificacionPendiente).toHaveBeenCalled())
    await esperarUnMomento()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('si lo cierra, no vuelve a saltar por ese pedido', async () => {
    const clic = userEvent.setup()
    montar()

    await clic.click(await screen.findByRole('button', { name: 'Ahora no' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem('calificacionDescartada:12')).toBe('1')
  })

  test('un pedido ya descartado no se vuelve a ofrecer', async () => {
    localStorage.setItem('calificacionDescartada:12', '1')
    montar()
    await waitFor(() => expect(getCalificacionPendiente).toHaveBeenCalled())
    await esperarUnMomento()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('si falla la consulta no molesta al cliente', async () => {
    vi.mocked(getCalificacionPendiente).mockRejectedValue(new Error('Sin conexión'))
    montar()
    await waitFor(() => expect(getCalificacionPendiente).toHaveBeenCalled())
    await esperarUnMomento()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
