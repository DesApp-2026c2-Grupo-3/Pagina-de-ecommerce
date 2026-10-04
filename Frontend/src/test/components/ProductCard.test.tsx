import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../../components/home/ProductCard'
import type { ProductoBackend } from '../../types/product'

function producto(datos: Partial<ProductoBackend> = {}): ProductoBackend {
  return {
    id: 1,
    nombre: 'Clásica',
    descripcion: 'Carne, queso y lechuga',
    precio: 5000,
    imagen: '/imagenes/clasica.png',
    disponible: true,
    categoriaId: 1,
    ...datos,
  }
}

// La tarjeta es un link, así que necesita un router alrededor, como en la app
function renderizar(p: ProductoBackend) {
  return render(
    <MemoryRouter>
      <ProductCard product={p} />
    </MemoryRouter>,
  )
}

describe('ProductCard', () => {
  test('muestra el nombre, la descripción y el precio', () => {
    renderizar(producto())

    expect(screen.getByRole('heading', { name: 'Clásica' })).toBeInTheDocument()
    expect(screen.getByText('Carne, queso y lechuga')).toBeInTheDocument()
    expect(screen.getByText('$5.000')).toBeInTheDocument()
  })

  test('lleva al detalle del producto', () => {
    renderizar(producto({ id: 7 }))

    expect(screen.getByRole('link')).toHaveAttribute('href', '/producto/7')
  })

  describe('disponibilidad', () => {
    test('un producto disponible no tiene la etiqueta', () => {
      renderizar(producto())

      expect(screen.queryByText('No disponible')).not.toBeInTheDocument()
    })

    test('un producto no disponible muestra la etiqueta y la foto en gris', () => {
      renderizar(producto({ disponible: false }))

      expect(screen.getByText('No disponible')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Clásica' })).toHaveClass('grayscale')
    })

    test('un producto no disponible se puede abrir igual (para ver el detalle)', () => {
      renderizar(producto({ disponible: false }))

      expect(screen.getByRole('link')).toBeInTheDocument()
    })
  })

  describe('tamaños', () => {
    test('con tamaños, muestra "desde" y el precio más bajo', () => {
      renderizar(
        producto({
          nombre: 'Papas con cheddar',
          precio: 2400,
          tamanios: [
            { tamanioId: 3, tamanio: 'grande', precio: '3500', etiqueta: null },
            { tamanioId: 1, tamanio: 'regular', precio: '2400', etiqueta: null },
            { tamanioId: 2, tamanio: 'mediano', precio: '2900', etiqueta: null },
          ],
        }),
      )

      expect(screen.getByText('desde')).toBeInTheDocument()
      expect(screen.getByText('$2.400')).toBeInTheDocument()
    })

    test('sin tamaños, no dice "desde"', () => {
      renderizar(producto())

      expect(screen.queryByText('desde')).not.toBeInTheDocument()
    })
  })

  describe('foto', () => {
    test('con foto, la muestra', () => {
      renderizar(producto())

      expect(screen.getByRole('img', { name: 'Clásica' })).toHaveAttribute('src', '/imagenes/clasica.png')
    })

    test('sin foto, no dibuja una imagen vacía', () => {
      renderizar(producto({ imagen: '' }))

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })
})