import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CampoPassword from '../../components/CampoPassword'

describe('CampoPassword', () => {
  test('arranca oculta', () => {
    render(<CampoPassword placeholder="Tu contraseña" />)

    expect(screen.getByPlaceholderText('Tu contraseña')).toHaveAttribute('type', 'password')
  })

  test('el ojito la muestra y la vuelve a ocultar', async () => {
    render(<CampoPassword placeholder="Tu contraseña" />)
    const campo = screen.getByPlaceholderText('Tu contraseña')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(campo).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(campo).toHaveAttribute('type', 'password')
  })

  test('el ojito no envía el formulario', async () => {
    let enviado = false
    render(
      <form onSubmit={(e) => { e.preventDefault(); enviado = true }}>
        <CampoPassword placeholder="Tu contraseña" />
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(enviado).toBe(false)
  })
})