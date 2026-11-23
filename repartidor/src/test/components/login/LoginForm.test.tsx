import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LoginForm from '../../../components/login/LoginForm'

describe('LoginForm (accesibilidad, v1.12)', () => {
  test('correo y contraseña tienen su etiqueta asociada', () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
  })

  test('el botón del ojo muestra y oculta la contraseña', async () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()
  })
})
