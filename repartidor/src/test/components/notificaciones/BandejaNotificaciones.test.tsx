import { afterEach, describe, expect, test, vi } from 'vitest'
import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import BandejaNotificaciones from '../../../components/notificaciones/BandejaNotificaciones'
import { ToastProvider } from '../../../context/toasts/ToastProvider'
import { crearNotificacionesDePrueba, fijarPantallaChica } from '../../apoyoNotificaciones'
import { estadoCon, viajeAsignado } from '../../fixturesNotificaciones'
import type { EstadoNotificaciones } from '../../../types/notificacion.types'

const AVISO = viajeAsignado(1, '2026-11-17T10:00:00.000Z')

afterEach(() => {
  vi.restoreAllMocks()
})

function dibujar(estado: EstadoNotificaciones, { chica, abierta = true }: { chica: boolean; abierta?: boolean }) {
  fijarPantallaChica(chica)
  const { Proveedor, acciones } = crearNotificacionesDePrueba(estado)
  const onCerrar = vi.fn()
  const ancla = createRef<HTMLDivElement>()

  render(
    <MemoryRouter initialEntries={['/pedidos']}>
      <ToastProvider>
        <Proveedor>
          <div ref={ancla}>
            <button id="campana" type="button">Campana</button>
            <BandejaNotificaciones abierta={abierta} onCerrar={onCerrar} idPanel="panel" idDisparador="campana" ancla={ancla} />
          </div>
          <button type="button">Afuera</button>
          <Routes>
            <Route path="/pedidos" element={<p>Pantalla: pedidos</p>} />
            <Route path="/viaje" element={<p>Pantalla: viaje</p>} />
          </Routes>
        </Proveedor>
      </ToastProvider>
    </MemoryRouter>,
  )
  return { acciones, onCerrar }
}

describe('BandejaNotificaciones en el celular (hoja inferior)', () => {
  test('es un diálogo "Avisos" que ocupa el alto de la hoja', () => {
    dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: true })

    expect(screen.getByRole('dialog', { name: 'Avisos' })).toHaveClass('h-[85dvh]')
  })

  test('tocar un aviso: lo marca leído, cierra y lleva a su pantalla', async () => {
    const { acciones, onCerrar } = dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: true })

    await userEvent.click(screen.getByRole('button', { name: /Te asignaron el viaje #81/ }))

    expect(acciones.marcarLeida).toHaveBeenCalledWith(1)
    expect(onCerrar).toHaveBeenCalled()
    expect(screen.getByText('Pantalla: viaje')).toBeInTheDocument()
  })

  test('un aviso ya leído no se vuelve a marcar', async () => {
    const { acciones } = dibujar(estadoCon({ items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z', true)], noLeidas: 0 }), { chica: true })

    await userEvent.click(screen.getByRole('button', { name: /Te asignaron el viaje #81/ }))

    expect(acciones.marcarLeida).not.toHaveBeenCalled()
  })

  test('"Marcar todas" funciona con avisos sin leer y se deshabilita sin ellos', async () => {
    const { acciones } = dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: true })

    await userEvent.click(screen.getByRole('button', { name: 'Marcar todas' }))
    expect(acciones.marcarTodas).toHaveBeenCalledTimes(1)
  })

  test('sin avisos sin leer, "Marcar todas" está deshabilitado', () => {
    dibujar(estadoCon({ items: [], noLeidas: 0 }), { chica: true })

    expect(screen.getByRole('button', { name: 'Marcar todas' })).toBeDisabled()
  })

  test('mientras marca, lo dice y no se puede repetir', () => {
    dibujar(estadoCon({ items: [AVISO], noLeidas: 1, marcandoTodas: true }), { chica: true })

    expect(screen.getByRole('button', { name: 'Marcando…' })).toBeDisabled()
  })

  test('la X cierra', async () => {
    const { onCerrar } = dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: true })

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onCerrar).toHaveBeenCalled()
  })
})

describe('BandejaNotificaciones en escritorio (panel)', () => {
  test('cerrada no se dibuja', () => {
    dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: false, abierta: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('abierta: panel con título, cantidad sin leer y el foco adentro', () => {
    dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: false })

    const panel = screen.getByRole('dialog', { name: 'Avisos' })
    expect(panel).toHaveAttribute('id', 'panel')
    expect(panel).toHaveTextContent('1 sin leer')
    expect(panel).toHaveFocus()
  })

  test('Escape cierra y devuelve el foco a la campana', () => {
    const { onCerrar } = dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: false })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Campana' })).toHaveFocus()
  })

  test('tocar afuera cierra; tocar la campana o el panel, no', () => {
    const { onCerrar } = dibujar(estadoCon({ items: [AVISO], noLeidas: 1 }), { chica: false })

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Campana' }))
    fireEvent.pointerDown(screen.getByRole('dialog'))
    expect(onCerrar).not.toHaveBeenCalled()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Afuera' }))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })
})
