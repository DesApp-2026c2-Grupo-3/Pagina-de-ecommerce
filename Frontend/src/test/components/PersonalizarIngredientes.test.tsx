import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PersonalizarIngredientes from '../../components/PersonalizarIngredientes'
import type { Eleccion } from '../../utils/personalizacion'
import type { ProductIngredient } from '../../types/product'

function ingrediente(datos: Partial<ProductIngredient>): ProductIngredient {
  return {
    insumoId: 0,
    nombre: 'Insumo',
    unidadMedida: 'unidad',
    cantidadBase: 1,
    esRemovible: false,
    esAgregable: false,
    precioComercial: 0,
    ...datos,
  }
}

const receta = [
  ingrediente({ insumoId: 1, nombre: 'Pan' }),
  ingrediente({ insumoId: 2, nombre: 'Cebolla', esRemovible: true }),
  ingrediente({ insumoId: 3, nombre: 'Cheddar', esRemovible: true, esAgregable: true, precioComercial: 500 }),
  ingrediente({ insumoId: 4, nombre: 'Medallón', esAgregable: true, precioComercial: 1500 }),
]

function elegir(quitados: number[] = [], extras: number[] = []): Eleccion {
  return { quitados: new Set(quitados), extras: new Set(extras) }
}

describe('PersonalizarIngredientes', () => {
  test('muestra lo fijo como incluido, sin casilla para quitarlo', () => {
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir()} onChange={() => {}} />)

    expect(screen.getByText('Pan')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Pan' })).not.toBeInTheDocument()
  })

  test('lo que trae la hamburguesa viene tildado', () => {
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir()} onChange={() => {}} />)

    expect(screen.getByRole('checkbox', { name: 'Cebolla' })).toBeChecked()
  })

  test('destildar un ingrediente avisa que se quita', async () => {
    const onChange = vi.fn()
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir()} onChange={onChange} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Cebolla' }))

    expect(onChange).toHaveBeenCalledWith(elegir([2], []))
  })

  test('quitar un ingrediente también le saca el extra', async () => {
    const onChange = vi.fn()
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir([], [3])} onChange={onChange} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Cheddar' }))

    expect(onChange).toHaveBeenCalledWith(elegir([3], []))
  })

  test('tildar un extra avisa que se suma', async () => {
    const onChange = vi.fn()
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir()} onChange={onChange} />)

    await userEvent.click(screen.getByRole('checkbox', { name: /Medallón extra/ }))

    expect(onChange).toHaveBeenCalledWith(elegir([], [4]))
  })

  test('el extra de un ingrediente quitado no se puede tildar', () => {
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir([3])} onChange={() => {}} />)

    expect(screen.getByRole('checkbox', { name: /Cheddar extra/ })).toBeDisabled()
  })

  test('muestra el precio de cada extra', () => {
    render(<PersonalizarIngredientes ingredientes={receta} eleccion={elegir()} onChange={() => {}} />)

    expect(screen.getByText('+$1.500')).toBeInTheDocument()
  })

  test('sin nada para personalizar, lo avisa', () => {
    render(
      <PersonalizarIngredientes ingredientes={[receta[0]]} eleccion={elegir()} onChange={() => {}} />,
    )

    expect(screen.getByText('Este producto no tiene opciones para personalizar.')).toBeInTheDocument()
  })
})