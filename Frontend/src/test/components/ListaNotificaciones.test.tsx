import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import ListaNotificaciones from '../../components/notificaciones/ListaNotificaciones'
import type { NotificacionCliente } from '../../types/notificacion.types'

const aviso = (id: number, leida: boolean): NotificacionCliente => ({
  id,
  version: 1,
  tipo: 'pedido.estado_cambiado',
  ocurridoEn: '2026-01-02T10:05:00.000Z',
  leida,
  leidaEn: leida ? '2026-01-02T10:06:00.000Z' : null,
  datos: {
    pedidoId: 50 + id,
    usuarioId: 7,
    sucursalId: 2,
    estadoAnterior: 'Pendiente',
    estado: 'En proceso',
    total: 5000,
    fecha: '2026-01-02T10:05:00.000Z',
  },
})

type Props = ComponentProps<typeof ListaNotificaciones>

function propsCon(cambios: Partial<Props> = {}): Props {
  return {
    items: [aviso(1, false), aviso(2, true)],
    cargandoInicial: false,
    cargandoMas: false,
    hayMas: false,
    onCargarMas: vi.fn(),
    onAbrir: vi.fn(),
    ...cambios,
  }
}

function renderizar(cambios: Partial<Props> = {}) {
  const props = propsCon(cambios)
  const resultado = render(<ListaNotificaciones {...props} />)
  return { props, ...resultado }
}

describe('ListaNotificaciones', () => {
  test('mientras carga por primera vez muestra el indicador', () => {
    renderizar({ items: [], cargandoInicial: true })
    expect(screen.getByText('Cargando notificaciones…')).toBeInTheDocument()
  })

  test('sin avisos muestra el estado vacío', () => {
    renderizar({ items: [] })
    expect(screen.getByText('No tenés notificaciones todavía')).toBeInTheDocument()
  })

  test('cada aviso muestra título, detalle y si está sin leer', () => {
    renderizar()

    const noLeido = screen.getByRole('button', { name: /Sin leer\.\s*Pedido #51: En proceso/ })
    expect(noLeido).toHaveTextContent('Antes estaba en Pendiente')
    expect(screen.getByRole('button', { name: /^Pedido #52: En proceso/ })).toBeInTheDocument()
  })

  test('tocar un aviso lo entrega a quien abre', async () => {
    const usuario = userEvent.setup()
    const { props } = renderizar()

    await usuario.click(screen.getByRole('button', { name: /Pedido #51/ }))
    expect(props.onAbrir).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  test('mientras trae la página siguiente lo anuncia y no muestra el botón', () => {
    renderizar({ hayMas: true, cargandoMas: true })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando anteriores…')
    expect(screen.queryByRole('button', { name: 'Ver anteriores' })).not.toBeInTheDocument()
  })

  test('«Ver anteriores» pide más y, cuando llegan, el foco pasa al primero nuevo (C-4)', async () => {
    const usuario = userEvent.setup()
    const { props, rerender } = renderizar({ hayMas: true })

    await usuario.click(screen.getByRole('button', { name: 'Ver anteriores' }))
    expect(props.onCargarMas).toHaveBeenCalledTimes(1)

    rerender(<ListaNotificaciones {...props} items={[...props.items, aviso(3, true), aviso(4, true)]} />)

    expect(screen.getByRole('button', { name: /Pedido #53/ })).toHaveFocus()
  })

  test('cada aviso indica cuándo ocurrió con la fecha completa como título', () => {
    renderizar()

    const tiempo = document.querySelector('time')!
    expect(tiempo).toHaveAttribute('dateTime', '2026-01-02T10:05:00.000Z')
    expect(tiempo.getAttribute('title')).not.toBe('')
  })
})
