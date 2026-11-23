import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TarjetaPedidoViaje from '../../../components/viaje/TarjetaPedidoViaje'
import { pedido } from '../../fixturesPedidos'

function dibujar(cambios: Partial<Parameters<typeof TarjetaPedidoViaje>[0]> = {}) {
  const props = {
    pedido: pedido(45),
    onRetirar: vi.fn(),
    onEntregar: vi.fn(),
    onQuitarPedido: vi.fn(),
    procesando: false,
    puedeRetirar: true,
    puedeEntregar: false,
    puedeQuitar: true,
    ...cambios,
  }
  render(<TarjetaPedidoViaje {...props} />)
  return props
}

describe('TarjetaPedidoViaje: botones', () => {
  test('preparando: "Retirar pedido" y "Quitar del viaje"', async () => {
    const { onRetirar, onQuitarPedido } = dibujar()

    await userEvent.click(screen.getByRole('button', { name: 'Retirar pedido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Quitar del viaje' }))

    expect(onRetirar).toHaveBeenCalledWith(45)
    expect(onQuitarPedido).toHaveBeenCalledWith(45)
  })

  test('retirando: "Retirando…" y no se puede quitar mientras tanto', () => {
    dibujar({ procesando: true })

    expect(screen.getByRole('button', { name: 'Retirando…' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Quitar del viaje' })).toBeDisabled()
  })

  test('ya retirado: muestra la marca y no hay botones de retirar ni quitar', () => {
    dibujar({ pedido: pedido(45, { retiradoEn: '2026-11-17T10:05:00.000Z' }) })

    expect(screen.getByText('Retirado del local')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retirar pedido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Quitar del viaje' })).not.toBeInTheDocument()
  })

  test('en camino: "Confirmar entrega" solo cuando se puede entregar', async () => {
    const { onEntregar } = dibujar({ pedido: pedido(45, { estado: 'En camino' }), puedeEntregar: true })

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }))
    expect(onEntregar).toHaveBeenCalledWith(45)
  })

  test('en camino sin recepción confirmada: entregar queda deshabilitado', () => {
    dibujar({ pedido: pedido(45, { estado: 'En camino' }), puedeEntregar: false })

    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled()
  })
})
