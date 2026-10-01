import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Stepper from '../../components/Stepper'

const PASOS = ['Hamburguesa', 'Papas', 'Bebida', 'Resumen']

describe('Stepper', () => {
  test('muestra un botón por cada paso', () => {
    render(<Stepper pasos={PASOS} actual={1} onIrA={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  test('marca cuál es el paso actual', () => {
    render(<Stepper pasos={PASOS} actual={2} onIrA={() => {}} />)

    expect(screen.getByRole('button', { name: 'Paso 2: Papas' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Paso 1: Hamburguesa' })).not.toHaveAttribute('aria-current')
  })

  test('los pasos ya hechos muestran un check y los que faltan su número', () => {
    render(<Stepper pasos={PASOS} actual={3} onIrA={() => {}} />)

    expect(screen.getByRole('button', { name: 'Paso 1: Hamburguesa' })).toHaveTextContent('✓')
    expect(screen.getByRole('button', { name: 'Paso 4: Resumen' })).toHaveTextContent('4')
  })

  test('muestra en texto el paso actual (para celular)', () => {
    render(<Stepper pasos={PASOS} actual={2} onIrA={() => {}} />)

    expect(screen.getByText('Paso 2 de 4 · Papas')).toBeInTheDocument()
  })

  test('al tocar un paso, avisa a cuál se quiere ir', async () => {
    const onIrA = vi.fn()
    render(<Stepper pasos={PASOS} actual={1} onIrA={onIrA} />)

    await userEvent.click(screen.getByRole('button', { name: 'Paso 3: Bebida' }))

    expect(onIrA).toHaveBeenCalledWith(3)
  })
})