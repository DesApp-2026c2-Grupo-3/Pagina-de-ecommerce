import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../../components/home/ProductCard'
import type { ProductoBackend } from '../../types/product'

const producto = (datos: Partial<ProductoBackend> = {}): ProductoBackend => ({
  id: 1,
  nombre: 'Clásica',
  descripcion: 'Carne, queso y lechuga',
  precio: 5000,
  imagen: 'https://res.cloudinary.com/demo/image/upload/v1/Productos/clasica.png',
  disponible: true,
  categoriaId: 1,
  ...datos,
})

function renderizar(compacta: boolean, p = producto()) {
  return render(
    <MemoryRouter>
      <ProductCard product={p} compacta={compacta} />
    </MemoryRouter>,
  )
}

describe('ProductCard compacta (catálogo en celular)', () => {
  test('en celular es una fila y desde tablet vuelve a ser vertical', () => {
    renderizar(true)
    const tarjeta = screen.getByRole('article')
    expect(tarjeta).toHaveClass('flex-row', 'sm:flex-col')
  })

  test('sin la marca, la card sigue siendo vertical siempre (Home, carrito)', () => {
    renderizar(false)
    const tarjeta = screen.getByRole('article')
    expect(tarjeta).toHaveClass('flex-col')
    expect(tarjeta).not.toHaveClass('flex-row')
  })

  test('muestra los mismos datos en las dos versiones', () => {
    renderizar(true)
    expect(screen.getByRole('heading', { name: 'Clásica' })).toBeInTheDocument()
    expect(screen.getByText('Carne, queso y lechuga')).toBeInTheDocument()
    expect(screen.getByText('$5.000')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/producto/1')
  })

  test('la foto se pide liviana a Cloudinary y se carga de forma diferida', () => {
    renderizar(true)
    const foto = screen.getByRole('img')
    expect(foto).toHaveAttribute('src', expect.stringContaining('f_auto,q_auto,w_400'))
    expect(foto).toHaveAttribute('loading', 'lazy')
  })

  test('la versión vertical pide una foto más grande', () => {
    renderizar(false)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('w_600'))
  })

  test('una foto local no se modifica', () => {
    renderizar(true, producto({ imagen: '/imagenes/clasica.png' }))
    expect(screen.getByRole('img')).toHaveAttribute('src', '/imagenes/clasica.png')
  })

  test('la etiqueta "No disponible" sigue apareciendo', () => {
    renderizar(true, producto({ disponible: false }))
    expect(screen.getByText('No disponible')).toBeInTheDocument()
  })
})
