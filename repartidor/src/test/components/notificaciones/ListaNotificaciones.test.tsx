import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ListaNotificaciones from '../../../components/notificaciones/ListaNotificaciones'
import { estadoCon, viajeAsignado } from '../../fixturesNotificaciones'
import type { EstadoNotificaciones } from '../../../types/notificacion.types'

const AHORA = Date.parse('2026-11-17T10:30:00.000Z')

function dibujar(estado: EstadoNotificaciones) {
  const acciones = { onAbrir: vi.fn(), onReintentar: vi.fn(), onCargarMas: vi.fn() }
  render(<ListaNotificaciones estado={estado} ahora={AHORA} {...acciones} />)
  return acciones
}

describe('ListaNotificaciones', () => {
  test('cargando sin avisos: esqueleto', () => {
    dibujar(estadoCon({ cargandoInicial: true }))

    expect(screen.getByLabelText('Cargando avisos')).toHaveAttribute('aria-busy', 'true')
  })

  test('vacía', () => {
    dibujar(estadoCon({}))

    expect(screen.getByText('No tenés avisos todavía')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver anteriores' })).not.toBeInTheDocument()
  })

  test('error sin avisos: alerta con reintentar', async () => {
    const { onReintentar } = dibujar(estadoCon({ error: 'Sin conexión con el servidor' }))

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar tus avisos')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })

  test('recargando con avisos ya cargados: se siguen viendo (sin esqueleto)', () => {
    dibujar(estadoCon({ cargandoInicial: true, items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z')] }))

    expect(screen.queryByLabelText('Cargando avisos')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  test('con más páginas: "Ver anteriores" pide la siguiente', async () => {
    const { onCargarMas } = dibujar(estadoCon({ items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z')], siguienteCursor: 'c1' }))

    await userEvent.click(screen.getByRole('button', { name: 'Ver anteriores' }))
    expect(onCargarMas).toHaveBeenCalledTimes(1)
  })

  test('sin más páginas: no hay "Ver anteriores"', () => {
    dibujar(estadoCon({ items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z')] }))

    expect(screen.queryByRole('button', { name: 'Ver anteriores' })).not.toBeInTheDocument()
  })

  test('falla al pedir anteriores: avisa sin borrar la lista', () => {
    dibujar(estadoCon({ items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z')], siguienteCursor: 'c1', errorCargaMas: 'No se pudieron cargar más' }))

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar más')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  test('mientras pide anteriores, el botón queda ocupado', () => {
    dibujar(estadoCon({ items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z')], siguienteCursor: 'c1', cargandoMas: true }))

    expect(screen.getByRole('button', { name: 'Cargando…' })).toBeDisabled()
  })
})
