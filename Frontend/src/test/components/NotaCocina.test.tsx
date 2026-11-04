import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotaCocina from '../../components/cart/NotaCocina'

function renderizar(guardada = '') {
  const onGuardar = vi.fn()
  const vista = render(<NotaCocina guardada={guardada} onGuardar={onGuardar} />)
  return { onGuardar, ...vista }
}

describe('NotaCocina', () => {
  test('arranca oculta, solo con el botón para abrirla', () => {
    renderizar()
    expect(screen.getByRole('button', { name: /notas para la cocina/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('al abrirla se escribe y Guardar entrega la nota sin espacios de más', async () => {
    const usuario = userEvent.setup()
    const { onGuardar } = renderizar()

    await usuario.click(screen.getByRole('button', { name: /notas para la cocina/i }))
    await usuario.type(screen.getByRole('textbox'), '  sin cebolla ')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onGuardar).toHaveBeenCalledWith('sin cebolla')
  })

  test('Guardar está deshabilitado si no hay texto', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: /notas para la cocina/i }))

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  test('Descartar cierra sin guardar', async () => {
    const usuario = userEvent.setup()
    const { onGuardar } = renderizar()

    await usuario.click(screen.getByRole('button', { name: /notas para la cocina/i }))
    await usuario.type(screen.getByRole('textbox'), 'bien cocida')
    await usuario.click(screen.getByRole('button', { name: 'Descartar' }))

    expect(onGuardar).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('Escape descarta el borrador', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: /notas para la cocina/i }))
    await usuario.type(screen.getByRole('textbox'), 'hola{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('con una nota guardada muestra el texto y los íconos de ver, editar y quitar', () => {
    renderizar('sin cebolla')
    expect(screen.getByText('sin cebolla')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver la nota completa/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar la nota/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quitar la nota/i })).toBeInTheDocument()
  })

  test('el ojo expande y vuelve a recortar la nota', async () => {
    const usuario = userEvent.setup()
    renderizar('sin cebolla')

    await usuario.click(screen.getByRole('button', { name: /ver la nota completa/i }))
    expect(screen.getByRole('button', { name: /ocultar la nota completa/i })).toHaveAttribute('aria-pressed', 'true')
  })

  test('el lápiz abre la edición con la nota guardada y Descartar la conserva', async () => {
    const usuario = userEvent.setup()
    const { onGuardar } = renderizar('sin cebolla')

    await usuario.click(screen.getByRole('button', { name: /editar la nota/i }))
    expect(screen.getByRole('textbox')).toHaveValue('sin cebolla')

    await usuario.type(screen.getByRole('textbox'), ' ni tomate')
    await usuario.click(screen.getByRole('button', { name: 'Descartar' }))

    expect(onGuardar).not.toHaveBeenCalled()
    expect(screen.getByText('sin cebolla')).toBeInTheDocument()
  })

  test('el lápiz permite guardar una versión nueva', async () => {
    const usuario = userEvent.setup()
    const { onGuardar } = renderizar('sin cebolla')

    await usuario.click(screen.getByRole('button', { name: /editar la nota/i }))
    await usuario.type(screen.getByRole('textbox'), ' ni tomate')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onGuardar).toHaveBeenCalledWith('sin cebolla ni tomate')
  })

  test('la papelera quita la nota', async () => {
    const usuario = userEvent.setup()
    const { onGuardar } = renderizar('sin cebolla')

    await usuario.click(screen.getByRole('button', { name: /quitar la nota/i }))

    expect(onGuardar).toHaveBeenCalledWith('')
  })
})
