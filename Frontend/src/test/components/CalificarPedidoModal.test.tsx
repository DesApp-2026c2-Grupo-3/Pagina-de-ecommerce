import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalificarPedidoModal from '../../components/calificaciones/CalificarPedidoModal'
import { calificarPedido } from '../../services/calificacionService'

vi.mock('../../services/calificacionService', () => ({ calificarPedido: vi.fn() }))

const base = {
  pedidoId: 12,
  fecha: '2026-10-30T18:00:00Z',
  entregadoEn: '2026-10-30T19:00:00Z',
  total: 5400,
  sucursal: { id: 2, nombre: 'Hurlingham' },
}

const dosProductos = {
  ...base,
  items: [
    { productoId: 7, nombre: 'Fast Classic', imagen: null },
    { productoId: 9, nombre: 'Sprite', imagen: null },
  ],
}

const unProducto = { ...base, items: [{ productoId: 7, nombre: 'Fast Classic', imagen: null }] }

function renderizar(pendiente = dosProductos) {
  const onDescartar = vi.fn()
  const onTerminar = vi.fn()
  render(<CalificarPedidoModal pendiente={pendiente} usuarioId={3} onDescartar={onDescartar} onTerminar={onTerminar} />)
  return { onDescartar, onTerminar }
}

beforeEach(() => vi.clearAllMocks())

describe('CalificarPedidoModal', () => {
  test('muestra el pedido, el primer producto y no deja enviar sin calificar nada', () => {
    renderizar()
    expect(screen.getByText(/hurlingham/i)).toBeInTheDocument()
    expect(screen.getByText('Fast Classic')).toBeInTheDocument()
    expect(screen.getByText('Producto 1 de 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  test('la flecha del medio avanza al producto siguiente y la de la izquierda vuelve', async () => {
    const usuario = userEvent.setup()
    renderizar()

    expect(screen.queryByRole('button', { name: 'Producto anterior' })).not.toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Producto siguiente' }))

    expect(screen.getByText('Sprite')).toBeInTheDocument()
    expect(screen.getByText('Producto 2 de 2')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Producto siguiente' })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Producto anterior' }))
    expect(screen.getByText('Fast Classic')).toBeInTheDocument()
  })

  test('con un solo producto no hay flechas ni contador', () => {
    renderizar(unProducto)
    expect(screen.queryByRole('button', { name: 'Producto siguiente' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Producto 1 de/)).not.toBeInTheDocument()
  })

  test('cada producto se califica por separado y se envía lo que se calificó', async () => {
    const usuario = userEvent.setup()
    vi.mocked(calificarPedido).mockResolvedValue({ mensaje: 'ok' })
    renderizar()

    await usuario.click(screen.getByRole('radio', { name: '4 estrellas' }))
    await usuario.type(screen.getByLabelText(/contanos más/i), 'Muy rico')
    await usuario.click(screen.getByRole('button', { name: 'Producto siguiente' }))
    await usuario.click(screen.getByRole('radio', { name: '2 estrellas' }))
    await usuario.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(calificarPedido).toHaveBeenCalledWith(3, 12, {
      7: { puntaje: 4, comentario: 'Muy rico' },
      9: { puntaje: 2, comentario: '' },
    })
  })

  test('lo que se cargó queda al volver a un producto', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('radio', { name: '5 estrellas' }))
    await usuario.type(screen.getByLabelText(/contanos más/i), 'Excelente')
    await usuario.click(screen.getByRole('button', { name: 'Producto siguiente' }))
    await usuario.click(screen.getByRole('button', { name: 'Producto anterior' }))

    expect(screen.getByRole('radio', { name: '5 estrellas' })).toBeChecked()
    expect(screen.getByLabelText(/contanos más/i)).toHaveValue('Excelente')
  })

  test('se puede saltear un producto y enviar solo el otro', async () => {
    const usuario = userEvent.setup()
    vi.mocked(calificarPedido).mockResolvedValue({ mensaje: 'ok' })
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Producto siguiente' }))
    await usuario.click(screen.getByRole('radio', { name: '5 estrellas' }))
    await usuario.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(calificarPedido).toHaveBeenCalledWith(3, 12, { 9: { puntaje: 5, comentario: '' } })
  })

  test('un comentario solo (sin estrellas) alcanza para enviar', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.type(screen.getByLabelText(/contanos más/i), 'Llegó frío')

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled()
  })

  test('un comentario de solo espacios no alcanza', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.type(screen.getByLabelText(/contanos más/i), '   ')

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  test('tocar de nuevo la estrella elegida la saca, y sin nada vuelve a no dejar enviar', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('radio', { name: '3 estrellas' }))
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled()

    await usuario.click(screen.getByRole('radio', { name: '3 estrellas' }))
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
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
