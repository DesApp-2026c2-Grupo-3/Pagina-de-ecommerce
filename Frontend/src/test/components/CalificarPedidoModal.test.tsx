import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalificarPedidoModal from '../../components/calificaciones/CalificarPedidoModal'
import { calificarPedido } from '../../services/calificacionService'

vi.mock('../../services/calificacionService', () => ({ calificarPedido: vi.fn() }))

const pendiente = {
  pedidoId: 12,
  fecha: '2026-10-30T18:00:00Z',
  entregadoEn: '2026-10-30T19:00:00Z',
  total: 5400,
  sucursal: { id: 2, nombre: 'Hurlingham' },
  productos: ['Fast Classic', 'Sprite'],
}

function renderizar() {
  const onDescartar = vi.fn()
  const onTerminar = vi.fn()
  render(<CalificarPedidoModal pendiente={pendiente} usuarioId={3} onDescartar={onDescartar} onTerminar={onTerminar} />)
  return { onDescartar, onTerminar }
}

beforeEach(() => vi.clearAllMocks())

describe('CalificarPedidoModal', () => {
  test('muestra el pedido y no deja enviar sin estrellas', () => {
    renderizar()
    expect(screen.getByText(/hurlingham/i)).toBeInTheDocument()
    expect(screen.getByText('Fast Classic · Sprite')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  test('con estrellas se envía el puntaje y el comentario sin espacios de más', async () => {
    const usuario = userEvent.setup()
    vi.mocked(calificarPedido).mockResolvedValue({ mensaje: 'ok' })
    renderizar()

    await usuario.click(screen.getByRole('radio', { name: '4 estrellas' }))
    await usuario.type(screen.getByLabelText(/contanos más/i), '  Muy rico ')
    await usuario.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(calificarPedido).toHaveBeenCalledWith(3, 12, 4, '  Muy rico ')
  })

  test('el comentario es opcional', async () => {
    const usuario = userEvent.setup()
    vi.mocked(calificarPedido).mockResolvedValue({ mensaje: 'ok' })
    renderizar()

    await usuario.click(screen.getByRole('radio', { name: '5 estrellas' }))
    await usuario.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(calificarPedido).toHaveBeenCalledWith(3, 12, 5, '')
  })

  test('después de enviar agradece y "Listo" termina', async () => {
    const usuario = userEvent.setup()
    vi.mocked(calificarPedido).mockResolvedValue({ mensaje: 'ok' })
    const { onTerminar, onDescartar } = renderizar()

    await usuario.click(screen.getByRole('radio', { name: '3 estrellas' }))
    await usuario.click(screen.getByRole('button', { name: 'Enviar' }))
    await usuario.click(await screen.findByRole('button', { name: 'Listo' }))

    expect(onTerminar).toHaveBeenCalled()
    expect(onDescartar).not.toHaveBeenCalled()
  })

  test('si falla el envío muestra el error y deja reintentar', async () => {
    const usuario = userEvent.setup()
    vi.mocked(calificarPedido).mockRejectedValue(new Error('Ya calificaste este pedido'))
    renderizar()

    await usuario.click(screen.getByRole('radio', { name: '2 estrellas' }))
    await usuario.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya calificaste este pedido')
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled()
  })

  test('"Ahora no" cierra sin calificar', async () => {
    const usuario = userEvent.setup()
    const { onDescartar } = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Ahora no' }))

    expect(onDescartar).toHaveBeenCalled()
    expect(calificarPedido).not.toHaveBeenCalled()
  })

  test('se puede cerrar con la ✕ y con Esc', async () => {
    const usuario = userEvent.setup()
    const { onDescartar } = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))
    await usuario.keyboard('{Escape}')

    expect(onDescartar).toHaveBeenCalledTimes(2)
  })
})
