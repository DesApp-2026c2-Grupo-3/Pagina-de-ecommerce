import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Dialogo from '../../../components/ui/Dialogo'
import { ToastProvider } from '../../../context/toasts/ToastProvider'

function dibujar(props: Partial<Parameters<typeof Dialogo>[0]> = {}) {
  const onCerrar = vi.fn()
  const resultado = render(
    <Dialogo abierto titulo="Pedir asistencia" onCerrar={onCerrar} {...props}>
      <p>Contenido</p>
      <button type="button">Enviar</button>
    </Dialogo>,
    // Dialogo se anota como capa de los toasts
    { wrapper: ToastProvider },
  )
  return { onCerrar, ...resultado }
}

describe('Dialogo', () => {
  test('abierto: se anuncia como diálogo con su título como nombre', () => {
    dibujar()

    expect(screen.getByRole('dialog', { name: 'Pedir asistencia' })).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  test('cerrado: no se muestra', () => {
    dibujar({ abierto: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('se abre y se cierra según la prop "abierto"', () => {
    const { rerender, onCerrar } = dibujar({ abierto: false })

    rerender(
      <Dialogo abierto titulo="Pedir asistencia" onCerrar={onCerrar}>
        <p>Contenido</p>
      </Dialogo>,
    )
    expect(screen.getByRole('dialog', { name: 'Pedir asistencia' })).toBeInTheDocument()

    rerender(
      <Dialogo abierto={false} titulo="Pedir asistencia" onCerrar={onCerrar}>
        <p>Contenido</p>
      </Dialogo>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Un cierre pedido por el padre no le vuelve a avisar
    expect(onCerrar).not.toHaveBeenCalled()
  })

  test('la X cierra', async () => {
    const { onCerrar } = dibujar()

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('Escape (evento cancel) cierra y frena el cierre nativo', () => {
    const { onCerrar } = dibujar()
    const evento = new Event('cancel', { cancelable: true })

    fireEvent(screen.getByRole('dialog'), evento)

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(evento.defaultPrevented).toBe(true)
  })

  test('un toque en el fondo cierra; uno en el contenido, no', async () => {
    const { onCerrar } = dibujar()

    await userEvent.click(screen.getByText('Contenido'))
    expect(onCerrar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('dialog'))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('bloqueado: ni Escape, ni el fondo, ni la X lo cierran', () => {
    const { onCerrar } = dibujar({ bloquearCierre: true })

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    fireEvent.click(screen.getByRole('dialog'))

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled()
    expect(onCerrar).not.toHaveBeenCalled()
  })

  test('si el navegador lo cierra por su cuenta, avisa para no quedar desfasado', () => {
    const { onCerrar } = dibujar()

    fireEvent(screen.getByRole('dialog'), new Event('close'))

    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('muestra acciones extra en el encabezado', () => {
    dibujar({ acciones: <button type="button">Marcar todas</button> })

    expect(screen.getByRole('button', { name: 'Marcar todas' })).toBeInTheDocument()
  })

  test('ocupar alto: hoja de 85 % de la pantalla; el contenido decide su scroll', () => {
    dibujar({ ocuparAlto: true })

    expect(screen.getByRole('dialog')).toHaveClass('h-[85dvh]', 'overflow-hidden')
    expect(screen.getByRole('dialog')).not.toHaveClass('overflow-visible')
  })

  test('no tiene scroll interno (regla W-7)', () => {
    dibujar()

    expect(screen.getByRole('dialog')).toHaveClass('overflow-visible')
    expect(screen.getByRole('dialog')).not.toHaveClass('overflow-y-auto')
  })
})
