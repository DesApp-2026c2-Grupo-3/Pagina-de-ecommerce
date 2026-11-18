import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bell, X } from 'lucide-react'

import BotonIcono from '../../../components/ui/BotonIcono'

describe('BotonIcono', () => {
  test('usa la etiqueta como nombre accesible y mide 44 × 44 px', () => {
    render(<BotonIcono icono={X} etiqueta="Cerrar aviso" />)

    const boton = screen.getByRole('button', { name: 'Cerrar aviso' })
    expect(boton).toHaveClass('size-11')
    expect(boton).toHaveAttribute('type', 'button')
  })

  test('al tocarlo avisa', async () => {
    const onClick = vi.fn()
    render(<BotonIcono icono={X} etiqueta="Cerrar" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('muestra lo que se le superpone (la insignia de la campana)', () => {
    render(
      <BotonIcono icono={Bell} etiqueta="Avisos, 3 sin leer">
        <span data-testid="superpuesto">3</span>
      </BotonIcono>,
    )

    expect(screen.getByRole('button', { name: 'Avisos, 3 sin leer' })).toContainElement(
      screen.getByTestId('superpuesto'),
    )
  })
})
