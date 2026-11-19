import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import FiltrosHistorial from '../../../components/historial/FiltrosHistorial'

function dibujar(filtroEstado = 'todos') {
  render(
    <FiltrosHistorial
      filtroEstado={filtroEstado}
      busqueda=""
      fechaDesde=""
      fechaHasta=""
      setFiltroEstado={vi.fn()}
      setBusqueda={vi.fn()}
      setFechaDesde={vi.fn()}
      setFechaHasta={vi.fn()}
    />,
  )
}

describe('FiltrosHistorial (accesibilidad, v1.12)', () => {
  test('cada campo tiene su etiqueta asociada', () => {
    dibujar()

    expect(screen.getByLabelText('Buscar viaje')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Desde')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('type', 'date')
  })

  test('el estado elegido se anuncia como presionado', () => {
    dibujar('cancelado')

    expect(screen.getByRole('button', { name: 'Cancelados' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false')
  })
})
