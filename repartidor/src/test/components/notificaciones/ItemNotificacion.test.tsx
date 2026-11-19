import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ItemNotificacion from '../../../components/notificaciones/ItemNotificacion'
import { pedidoCancelado, viajeAsignado } from '../../fixturesNotificaciones'

const AHORA = Date.parse('2026-11-17T10:03:00.000Z')

function dibujar(notificacion = viajeAsignado(1, '2026-11-17T10:00:00.000Z')) {
  const onAbrir = vi.fn()
  render(
    <ul>
      <ItemNotificacion notificacion={notificacion} ahora={AHORA} onAbrir={onAbrir} />
    </ul>,
  )
  return { onAbrir, boton: screen.getByRole('button') }
}

describe('ItemNotificacion', () => {
  test('muestra título, descripción y hace cuánto pasó', () => {
    const { boton } = dibujar()

    expect(boton).toHaveTextContent('Te asignaron el viaje #81')
    expect(boton).toHaveTextContent('Tiene 3 pedidos')
    expect(boton).toHaveTextContent('hace 3 minutos')
  })

  test('sin leer: lo anuncia, se resalta y lleva el punto', () => {
    const { boton } = dibujar()

    expect(boton).toHaveAccessibleName(/^Sin leer\./)
    expect(boton).toHaveClass('bg-orange-50/70')
  })

  test('leída: sin anuncio ni resalte', () => {
    const { boton } = dibujar(viajeAsignado(1, '2026-11-17T10:00:00.000Z', true))

    expect(boton).not.toHaveAccessibleName(/Sin leer/)
    expect(boton).toHaveClass('bg-white')
  })

  test('el ícono toma el color de su tono (cancelado = rojo)', () => {
    const { boton } = dibujar(pedidoCancelado(2, '2026-11-17T10:00:00.000Z'))

    expect(boton.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-red-100', 'text-red-700')
  })

  test('tocarlo lo abre', async () => {
    const notificacion = viajeAsignado(1, '2026-11-17T10:00:00.000Z')
    const { onAbrir, boton } = dibujar(notificacion)

    await userEvent.click(boton)

    expect(onAbrir).toHaveBeenCalledWith(notificacion)
  })
})
