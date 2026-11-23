import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import Insignia from '../../../components/ui/Insignia'

describe('Insignia', () => {
  test.each([0, null, -2])('no se muestra con %s', (cantidad) => {
    render(<Insignia cantidad={cantidad} />)

    expect(screen.queryByTestId('insignia')).not.toBeInTheDocument()
  })

  test('muestra el número y es decorativa para el lector de pantalla', () => {
    render(<Insignia cantidad={3} />)

    const insignia = screen.getByTestId('insignia')
    expect(insignia).toHaveTextContent('3')
    expect(insignia).toHaveAttribute('aria-hidden', 'true')
  })

  test('desde 100 muestra 99+', () => {
    render(<Insignia cantidad={120} />)

    expect(screen.getByTestId('insignia')).toHaveTextContent('99+')
  })

  test('99 se muestra tal cual', () => {
    render(<Insignia cantidad={99} />)

    expect(screen.getByTestId('insignia')).toHaveTextContent('99')
  })

  test('salta solo cuando el número sube', () => {
    const { rerender } = render(<Insignia cantidad={2} />)
    expect(screen.getByTestId('insignia')).not.toHaveClass('motion-safe:animate-insignia')

    rerender(<Insignia cantidad={1} />)
    expect(screen.getByTestId('insignia')).not.toHaveClass('motion-safe:animate-insignia')

    rerender(<Insignia cantidad={4} />)
    expect(screen.getByTestId('insignia')).toHaveClass('motion-safe:animate-insignia')
  })

  test('flotante se ubica en la esquina de su contenedor', () => {
    render(<Insignia cantidad={1} flotante />)

    expect(screen.getByTestId('insignia')).toHaveClass('absolute')
  })
})
