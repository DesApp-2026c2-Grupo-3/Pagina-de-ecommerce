import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ModalQuitarPedido from '../../../components/viaje/ModalQuitarPedido'
import { ToastProvider } from '../../../context/toasts/ToastProvider'

function dibujar(cambios: Partial<Parameters<typeof ModalQuitarPedido>[0]> = {}) {
  const props = { abierto: true, pedidoId: 45, procesando: false, error: '', onCancelar: vi.fn(), onConfirmar: vi.fn(), ...cambios }
  render(<ModalQuitarPedido {...props} />, { wrapper: ToastProvider })
  return props
}

describe('ModalQuitarPedido (sobre Dialogo)', () => {
  test('es un diálogo con su título y el número de pedido', () => {
    dibujar()

    expect(screen.getByRole('dialog', { name: 'Quitar pedido del viaje' })).toHaveTextContent('#45')
  })

  test('cerrado no se muestra', () => {
    dibujar({ abierto: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('"Volver" cancela y "Sí, quitar pedido" confirma', async () => {
    const { onCancelar, onConfirmar } = dibujar()

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, quitar pedido' }))

    expect(onCancelar).toHaveBeenCalledTimes(1)
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  test('mientras quita: "Quitando…" y no se puede volver ni cerrar', () => {
    dibujar({ procesando: true })

    expect(screen.getByRole('button', { name: 'Quitando…' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled()
  })

  test('el error del servidor se anuncia dentro del diálogo', () => {
    dibujar({ error: 'El pedido ya fue retirado.' })

    expect(screen.getByRole('alert')).toHaveTextContent('El pedido ya fue retirado.')
  })
})
