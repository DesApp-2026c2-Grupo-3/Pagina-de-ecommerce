import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from '../../context/CartContext'
import EditarItemModal from '../../components/EditarItemModal'
import { getProductoDetalle } from '../../services/productService'
import type { CartItem } from '../../types/cart'
import type { ProductIngredient, ProductoBackend } from '../../types/product'

// El backend es falso: el test decide qué producto devuelve
vi.mock('../../services/productService', () => ({ getProductoDetalle: vi.fn() }))

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

const hamburguesa: ProductoBackend = {
  id: 1,
  nombre: 'Clásica',
  descripcion: '',
  precio: 5000,
  imagen: '',
  disponible: true,
  categoriaId: 1,
  ingredientes: [
    ingrediente({ insumoId: 2, nombre: 'Cebolla', esRemovible: true }),
    ingrediente({ insumoId: 3, nombre: 'Cheddar', esRemovible: true, esAgregable: true, precioComercial: 500 }),
    ingrediente({ insumoId: 4, nombre: 'Medallón', esAgregable: true, precioComercial: 1500 }),
  ],
}

const papas: ProductoBackend = {
  id: 40,
  nombre: 'Papas con cheddar',
  descripcion: '',
  precio: 2400,
  imagen: '',
  disponible: true,
  categoriaId: 3,
  variantes: [
    { tamanio: 'regular', precio: '2400', etiqueta: null },
    { tamanio: 'grande', precio: '3500', etiqueta: null },
  ],
}

// 2 hamburguesas sin cebolla y con cheddar extra, tal como quedan guardadas en el carrito
const hamburguesaEnCarrito: CartItem = {
  id: '1-2:0|3:2',
  product: hamburguesa,
  quantity: 2,
  selectedOptions: ['Sin Cebolla', 'Extra Cheddar (+$500)'],
  unitPrice: 5500,
  tamanio: null,
  personalizaciones: [
    { insumoId: 2, cantidad: 0 },
    { insumoId: 3, cantidad: 2 },
  ],
}

const papasEnCarrito: CartItem = {
  id: '40-regular',
  product: papas,
  quantity: 1,
  selectedOptions: [],
  unitPrice: 2400,
  tamanio: 'regular',
}

// Muestra el estado del carrito, para ver qué cambió al guardar
function VerCarrito() {
  const { items, totalPrice } = useCart()
  return <p data-testid="carrito">{items.length} líneas · total {totalPrice}</p>
}

function renderizar(item: CartItem) {
  const onClose = vi.fn()
  localStorage.setItem('cart', JSON.stringify([item]))
  render(
    <CartProvider>
      <EditarItemModal item={item} onClose={onClose} />
      <VerCarrito />
    </CartProvider>,
  )
  return onClose
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(getProductoDetalle).mockReset()
})

describe('EditarItemModal', () => {
  test('marca lo que ya estaba elegido', async () => {
    vi.mocked(getProductoDetalle).mockResolvedValue(hamburguesa)
    renderizar(hamburguesaEnCarrito)

    expect(await screen.findByRole('checkbox', { name: 'Cebolla' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Cheddar extra/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Medallón extra/ })).not.toBeChecked()
  })

  test('muestra el precio actualizado mientras se cambia', async () => {
    vi.mocked(getProductoDetalle).mockResolvedValue(hamburguesa)
    renderizar(hamburguesaEnCarrito)

    // 2 x ($5000 + $500 de cheddar)
    expect(await screen.findByText('$11.000')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: /Medallón extra/ }))

    // 2 x ($5000 + $500 + $1500 de medallón)
    expect(screen.getByText('$14.000')).toBeInTheDocument()
  })

  test('guardar actualiza la línea del carrito y cierra el modal', async () => {
    vi.mocked(getProductoDetalle).mockResolvedValue(hamburguesa)
    const onClose = renderizar(hamburguesaEnCarrito)

    await userEvent.click(await screen.findByRole('checkbox', { name: /Medallón extra/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByTestId('carrito')).toHaveTextContent('1 líneas · total 14000')
    expect(onClose).toHaveBeenCalled()
  })

  test('cambia el tamaño de un producto con tamaños', async () => {
    vi.mocked(getProductoDetalle).mockResolvedValue(papas)
    renderizar(papasEnCarrito)

    await userEvent.click(await screen.findByRole('button', { name: /Grande/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByTestId('carrito')).toHaveTextContent('total 3500')
  })

  test('si no se puede cargar el producto, lo avisa', async () => {
    vi.mocked(getProductoDetalle).mockRejectedValue(new Error('sin conexión'))
    renderizar(hamburguesaEnCarrito)

    expect(await screen.findByText('No pudimos cargar el producto. Probá de nuevo.')).toBeInTheDocument()
  })
})