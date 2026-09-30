import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectorTamanio from '../../components/SelectorTamanio'
import type { ProductoBackend } from '../../types/product'

function producto(datos: Partial<ProductoBackend> = {}): ProductoBackend {
  return {
    id: 40,
    nombre: 'Papas con cheddar',
    descripcion: '',
    precio: 2400,
    imagen: '',
    disponible: true,
    categoriaId: 3,
    // Desordenadas a propósito
    variantes: [
      { tamanio: 'grande', precio: '3500', etiqueta: null },
      { tamanio: 'regular', precio: '2400', etiqueta: null },
      { tamanio: 'mediano', precio: '2900', etiqueta: null },
    ],
    ...datos,
  }
}

describe('SelectorTamanio', () => {
  test('muestra los tamaños en orden, con su precio', () => {
    render(<SelectorTamanio producto={producto()} valor={null} onChange={() => {}} />)

    const botones = screen.getAllByRole('button')
    expect(botones[0]).toHaveTextContent('Regular')
    expect(botones[0]).toHaveTextContent('$2.400')
    expect(botones[2]).toHaveTextContent('Grande')
    expect(botones[2]).toHaveTextContent('$3.500')
  })

  test('marca el tamaño elegido', () => {
    render(<SelectorTamanio producto={producto()} valor="mediano" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: /Mediano/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Regular/ })).toHaveAttribute('aria-pressed', 'false')
  })

  test('muestra la medida si la tiene (bebidas)', () => {
    const bebida = producto({ variantes: [{ tamanio: 'regular', precio: '1400', etiqueta: '354 ml' }] })
    render(<SelectorTamanio producto={bebida} valor={null} onChange={() => {}} />)

    expect(screen.getByText('354 ml')).toBeInTheDocument()
  })

  test('al tocar un tamaño, avisa cuál', async () => {
    const onChange = vi.fn()
    render(<SelectorTamanio producto={producto()} valor="regular" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: /Grande/ }))

    expect(onChange).toHaveBeenCalledWith('grande')
  })

  test('sin tamaños, no muestra nada', () => {
    const { container } = render(
      <SelectorTamanio producto={producto({ variantes: [] })} valor={null} onChange={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})