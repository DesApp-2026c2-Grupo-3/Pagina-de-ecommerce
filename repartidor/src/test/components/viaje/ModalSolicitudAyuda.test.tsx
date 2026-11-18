import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ModalSolicitudAyuda from '../../../components/viaje/ModalSolicitudAyuda'
import { ToastProvider } from '../../../context/toasts/ToastProvider'

function dibujar(cambios: Partial<Parameters<typeof ModalSolicitudAyuda>[0]> = {}) {
  const props = { abierto: true, enviando: false, error: '', onCerrar: vi.fn(), onConfirmar: vi.fn(), ...cambios }
  const resultado = render(<ModalSolicitudAyuda {...props} />, { wrapper: ToastProvider })
  return { ...props, ...resultado, props }
}

describe('ModalSolicitudAyuda (compacto, W-7)', () => {
  test('el motivo es un grupo de 4 opciones de una línea', () => {
    dibujar()

    const grupo = screen.getByRole('group', { name: 'Motivo de asistencia' })
    expect(grupo).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((opcion) => opcion.closest('label')?.textContent)).toEqual([
      'Vehículo',
      'Accidente',
      'Personal',
      'Otro',
    ])
  })

  test('sin motivo no envía y lo pide', async () => {
    const { onConfirmar } = dibujar()

    await userEvent.click(screen.getByRole('button', { name: 'Solicitar ayuda' }))

    expect(onConfirmar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Seleccioná un motivo para continuar.')
  })

  test('envía el motivo completo y el comentario sin espacios de más', async () => {
    const { onConfirmar } = dibujar()

    await userEvent.click(screen.getByRole('radio', { name: 'Vehículo' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Comentario (opcional)' }), '  Se pinchó la rueda  ')
    await userEvent.click(screen.getByRole('button', { name: 'Solicitar ayuda' }))

    expect(onConfirmar).toHaveBeenCalledWith({ motivo: 'Problema con el vehículo', comentario: 'Se pinchó la rueda' })
  })

  test('sin comentario, no lo manda', async () => {
    const { onConfirmar } = dibujar()

    await userEvent.click(screen.getByRole('radio', { name: 'Otro' }))
    await userEvent.click(screen.getByRole('button', { name: 'Solicitar ayuda' }))

    expect(onConfirmar).toHaveBeenCalledWith({ motivo: 'Otro', comentario: undefined })
  })

  test('cancelar avisa y descarta lo cargado', async () => {
    const { onCerrar } = dibujar()

    await userEvent.click(screen.getByRole('radio', { name: 'Accidente' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('radio', { name: 'Accidente' })).not.toBeChecked()
  })

  test('mientras envía: "Enviando…", opciones y comentario bloqueados', () => {
    dibujar({ enviando: true })

    expect(screen.getByRole('button', { name: 'Enviando…' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('radio', { name: 'Vehículo' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Comentario (opcional)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  test('comentario de hasta 150 caracteres en 4 renglones (v1.9)', () => {
    dibujar()

    const comentario = screen.getByRole('textbox', { name: 'Comentario (opcional)' })
    expect(comentario).toHaveAttribute('maxLength', '150')
    expect(comentario).toHaveAttribute('rows', '4')
    expect(screen.getByText('0/150')).toBeInTheDocument()
  })

  test('el comentario usa 16 px (evita el zoom automático de iOS)', () => {
    dibujar()

    expect(screen.getByRole('textbox', { name: 'Comentario (opcional)' })).toHaveClass('text-base')
  })
})
