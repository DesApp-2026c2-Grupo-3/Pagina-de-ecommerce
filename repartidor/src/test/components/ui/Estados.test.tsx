import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inbox } from 'lucide-react'

import EstadoVacio from '../../../components/ui/EstadoVacio'
import EstadoError from '../../../components/ui/EstadoError'
import Esqueleto from '../../../components/ui/Esqueleto'
import BarraAccionFija from '../../../components/ui/BarraAccionFija'

describe('EstadoVacio', () => {
  test('muestra título, descripción y acción opcional', () => {
    render(
      <EstadoVacio
        icono={Inbox}
        titulo="No tenés avisos todavía"
        descripcion="Acá vas a ver cuando te asignen un viaje."
        accion={<button type="button">Ver pedidos</button>}
      />,
    )

    expect(screen.getByText('No tenés avisos todavía')).toBeInTheDocument()
    expect(screen.getByText('Acá vas a ver cuando te asignen un viaje.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver pedidos' })).toBeInTheDocument()
  })
})

describe('EstadoError', () => {
  test('se anuncia como alerta y reintenta', async () => {
    const onReintentar = vi.fn()
    render(<EstadoError mensaje="Revisá tu conexión." onReintentar={onReintentar} />)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar')
    expect(screen.getByRole('alert')).toHaveTextContent('Revisá tu conexión.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })

  test('sin función de reintento no muestra el botón', () => {
    render(<EstadoError mensaje="Algo falló." />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('mientras reintenta, el botón queda ocupado', () => {
    render(<EstadoError mensaje="Algo falló." onReintentar={() => {}} reintentando />)

    expect(screen.getByRole('button', { name: 'Reintentando…' })).toBeDisabled()
  })
})

describe('Esqueleto', () => {
  test('es decorativo y toma el tamaño que se le pasa', () => {
    const { container } = render(<Esqueleto className="h-4 w-2/3" />)

    const bloque = container.firstElementChild
    expect(bloque).toHaveAttribute('aria-hidden', 'true')
    expect(bloque).toHaveClass('h-4', 'w-2/3', 'animate-pulse', 'rounded-md')
  })

  test('circular es redondo (y no queda la barra redondeada)', () => {
    const { container } = render(<Esqueleto className="size-10" circular />)

    expect(container.firstElementChild).toHaveClass('rounded-full')
    expect(container.firstElementChild).not.toHaveClass('rounded-md')
  })
})

describe('BarraAccionFija', () => {
  test('muestra la acción y la ayuda', () => {
    render(
      <BarraAccionFija ayuda="Retirá los 3 pedidos para poder salir">
        <button type="button">Iniciar viaje</button>
      </BarraAccionFija>,
    )

    expect(screen.getByText('Retirá los 3 pedidos para poder salir')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar viaje' })).toBeInTheDocument()
  })
})
