import { describe, expect, test, vi } from 'vitest'
import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CampanaNotificaciones from '../../../components/notificaciones/CampanaNotificaciones'
import { useTituloNoLeidas } from '../../../hooks/useTituloNoLeidas'

describe('CampanaNotificaciones', () => {
  test('el número va en el nombre accesible y en la insignia', () => {
    render(<CampanaNotificaciones id="c" noLeidas={3} abierta={false} idPanel="p" onAlternar={() => {}} />)

    const campana = screen.getByRole('button', { name: 'Avisos, 3 sin leer' })
    expect(campana).toHaveAttribute('aria-expanded', 'false')
    expect(campana).toHaveAttribute('aria-controls', 'p')
    expect(screen.getByTestId('insignia')).toHaveTextContent('3')
  })

  test('sin avisos sin leer: solo "Avisos" y sin insignia', () => {
    render(<CampanaNotificaciones id="c" noLeidas={0} abierta={false} idPanel="p" onAlternar={() => {}} />)

    expect(screen.getByRole('button', { name: 'Avisos' })).toBeInTheDocument()
    expect(screen.queryByTestId('insignia')).not.toBeInTheDocument()
  })

  test('tocarla alterna la bandeja', async () => {
    const onAlternar = vi.fn()
    render(<CampanaNotificaciones id="c" noLeidas={1} abierta onAlternar={onAlternar} idPanel="p" />)

    await userEvent.click(screen.getByRole('button', { name: 'Avisos, 1 sin leer' }))

    expect(onAlternar).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Avisos, 1 sin leer' })).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('useTituloNoLeidas (UX-13)', () => {
  test('pone el contador en la pestaña y lo saca en 0', () => {
    const { rerender } = renderHook(({ n }: { n: number | null }) => useTituloNoLeidas(n), { initialProps: { n: 3 } })
    expect(document.title).toBe('(3) Repartidor')

    rerender({ n: 0 })
    expect(document.title).toBe('Repartidor')

    rerender({ n: 150 })
    expect(document.title).toBe('(99+) Repartidor')
  })
})
