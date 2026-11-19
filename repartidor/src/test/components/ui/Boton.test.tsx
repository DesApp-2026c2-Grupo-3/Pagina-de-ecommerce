import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Truck } from 'lucide-react'

import Boton from '../../../components/ui/Boton'

describe('Boton', () => {
  test('es un botón de tipo "button" por defecto (no envía formularios)', () => {
    render(<Boton>Retirar</Boton>)

    expect(screen.getByRole('button', { name: 'Retirar' })).toHaveAttribute('type', 'button')
  })

  test('al tocarlo avisa', async () => {
    const onClick = vi.fn()
    render(<Boton onClick={onClick}>Retirar</Boton>)

    await userEvent.click(screen.getByRole('button', { name: 'Retirar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('mide 48 px por defecto y 56 px en tamaño grande', () => {
    render(
      <>
        <Boton>Chico</Boton>
        <Boton tamano="lg">Grande</Boton>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Chico' })).toHaveClass('min-h-12')
    expect(screen.getByRole('button', { name: 'Grande' })).toHaveClass('min-h-14')
  })

  test.each([
    ['primaria', 'bg-orange-700'],
    ['exito', 'bg-emerald-700'],
    ['peligro', 'bg-red-700'],
  ] as const)('la variante %s usa el tono 700 (texto blanco legible)', (variante, clase) => {
    render(<Boton variante={variante}>Acción</Boton>)

    expect(screen.getByRole('button', { name: 'Acción' })).toHaveClass(clase, 'text-white')
  })

  test('cargando: no se puede tocar, avisa que está ocupado y muestra el texto de carga', async () => {
    const onClick = vi.fn()
    render(
      <Boton cargando textoCargando="Retirando…" onClick={onClick}>
        Retirar
      </Boton>,
    )

    const boton = screen.getByRole('button', { name: 'Retirando…' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).toHaveClass('bg-orange-700')

    await userEvent.click(boton)
    expect(onClick).not.toHaveBeenCalled()
  })

  test('cargando sin texto de carga mantiene su texto', () => {
    render(<Boton cargando>Retirar</Boton>)

    expect(screen.getByRole('button', { name: 'Retirar' })).toBeDisabled()
  })

  test('deshabilitado: gris, sin aria-busy', () => {
    render(<Boton disabled>Iniciar viaje</Boton>)

    const boton = screen.getByRole('button', { name: 'Iniciar viaje' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveClass('bg-slate-200')
    expect(boton).not.toHaveAttribute('aria-busy')
  })

  test('el ícono es decorativo y el ancho completo es opcional', () => {
    render(
      <Boton icono={Truck} anchoCompleto>
        Tomar pedidos
      </Boton>,
    )

    const boton = screen.getByRole('button', { name: 'Tomar pedidos' })
    expect(boton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(boton).toHaveClass('w-full')
  })
})
