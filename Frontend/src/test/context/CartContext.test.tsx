import { beforeEach, describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CartProvider, useCart } from '../../context/CartContext'
import type { ProductoBackend } from '../../types/product'

// El hook necesita estar dentro del CartProvider, como en la app
function envoltorio({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

function usarCarrito() {
  return renderHook(() => useCart(), { wrapper: envoltorio })
}

const hamburguesa: ProductoBackend = {
  id: 1,
  nombre: 'Clásica',
  descripcion: '',
  precio: 5000,
  imagen: '',
  disponible: true,
  categoriaId: 1,
}

// Los tamaños vienen desordenados a propósito (1 regular, 3 grande)
const papas: ProductoBackend = {
  id: 40,
  nombre: 'Papas con cheddar',
  descripcion: '',
  precio: 2400,
  imagen: '',
  disponible: true,
  categoriaId: 3,
  tamanios: [
    { tamanioId: 3, tamanio: 'grande', precio: '3500', etiqueta: null },
    { tamanioId: 1, tamanio: 'regular', precio: '2400', etiqueta: null },
  ],
}

beforeEach(() => {
  // El carrito se guarda en localStorage: cada test arranca limpio
  localStorage.clear()
})

describe('CartContext', () => {
  test('arranca vacío', () => {
    const { result } = usarCarrito()

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  test('agrega un producto con su precio', () => {
    const { result } = usarCarrito()

    act(() => result.current.addItem(hamburguesa, 1))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.totalPrice).toBe(5000)
  })

  test('el mismo producto dos veces suma la cantidad en una sola línea', () => {
    const { result } = usarCarrito()

    act(() => result.current.addItem(hamburguesa, 1))
    act(() => result.current.addItem(hamburguesa, 1))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.totalPrice).toBe(10000)
  })

  test('ignora un producto no disponible', () => {
    const noDisponible = { ...hamburguesa, disponible: false }
    const { result } = usarCarrito()

    act(() => result.current.addItem(noDisponible, 1))

    expect(result.current.items).toEqual([])
  })

  describe('personalización', () => {
    test('una hamburguesa personalizada va en otra línea, con su precio', () => {
      const { result } = usarCarrito()

      act(() => result.current.addItem(hamburguesa, 1))
      act(() =>
        result.current.addItem(hamburguesa, 1, ['Extra Cheddar (+$500)'], {
          unitPrice: 5500,
          personalizaciones: [{ insumoId: 3, cantidad: 2 }],
        }),
      )

      expect(result.current.items).toHaveLength(2)
      expect(result.current.totalPrice).toBe(10500)
    })

    test('la misma personalización en otro orden es la misma línea', () => {
      const { result } = usarCarrito()

      act(() =>
        result.current.addItem(hamburguesa, 1, [], {
          personalizaciones: [{ insumoId: 5, cantidad: 0 }, { insumoId: 8, cantidad: 2 }],
        }),
      )
      act(() =>
        result.current.addItem(hamburguesa, 1, [], {
          personalizaciones: [{ insumoId: 8, cantidad: 2 }, { insumoId: 5, cantidad: 0 }],
        }),
      )

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
    })
  })

  describe('tamaños', () => {
    test('cobra el precio del tamaño elegido', () => {
      const { result } = usarCarrito()

      act(() => result.current.addItem(papas, 1, [], { tamanioId: 3 }))

      expect(result.current.items[0].tamanioId).toBe(3)
      expect(result.current.items[0].unitPrice).toBe(3500)
    })

    test('sin tamaño elegido, usa el regular (aunque no venga primero)', () => {
      const { result } = usarCarrito()

      act(() => result.current.addItem(papas, 1))

      expect(result.current.items[0].tamanioId).toBe(1)
      expect(result.current.items[0].unitPrice).toBe(2400)
    })

    test('tamaños distintos van en líneas distintas', () => {
      const { result } = usarCarrito()

      act(() => result.current.addItem(papas, 1, [], { tamanioId: 1 }))
      act(() => result.current.addItem(papas, 1, [], { tamanioId: 3 }))

      expect(result.current.items).toHaveLength(2)
      expect(result.current.totalPrice).toBe(5900)
    })
  })

  describe('modificar el carrito', () => {
    test('cambia la cantidad y recalcula el total', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))

      act(() => result.current.updateQuantity(result.current.items[0].id, 3))

      expect(result.current.totalItems).toBe(3)
      expect(result.current.totalPrice).toBe(15000)
    })

    test('cantidad 0 quita la línea', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))

      act(() => result.current.updateQuantity(result.current.items[0].id, 0))

      expect(result.current.items).toEqual([])
    })

    test('quita una línea', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))

      act(() => result.current.removeItem(result.current.items[0].id))

      expect(result.current.items).toEqual([])
    })

    test('vacía el carrito', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))
      act(() => result.current.addItem(papas, 1))

      act(() => result.current.clearCart())

      expect(result.current.items).toEqual([])
    })
  })

  describe('guardado en el navegador', () => {
    test('guarda el carrito en localStorage', () => {
      const { result } = usarCarrito()

      act(() => result.current.addItem(hamburguesa, 1))

      const guardado = JSON.parse(localStorage.getItem('cart') ?? '[]')
      expect(guardado).toHaveLength(1)
    })

    test('descarta ítems guardados con el formato viejo de producto', () => {
      localStorage.setItem(
        'cart',
        JSON.stringify([{ id: '1', product: { id: 1, name: 'Viejo', price: 100 }, quantity: 1 }]),
      )

      const { result } = usarCarrito()

      expect(result.current.items).toEqual([])
    })

    test('completa el precio si falta en un carrito guardado', () => {
      localStorage.setItem('cart', JSON.stringify([{ id: '1', product: hamburguesa, quantity: 2 }]))

      const { result } = usarCarrito()

      expect(result.current.items[0].unitPrice).toBe(5000)
      expect(result.current.totalPrice).toBe(10000)
    })
  })

  describe('editar una línea', () => {
    test('cambia la personalización y el precio, y mantiene la cantidad', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 2))

      act(() =>
        result.current.reemplazarItem(result.current.items[0].id, hamburguesa, ['Extra Cheddar (+$500)'], {
          unitPrice: 5500,
          personalizaciones: [{ insumoId: 3, cantidad: 2 }],
        }),
      )

      const linea = result.current.items[0]
      expect(result.current.items).toHaveLength(1)
      expect(linea.quantity).toBe(2)
      expect(linea.unitPrice).toBe(5500)
      expect(linea.selectedOptions).toEqual(['Extra Cheddar (+$500)'])
      expect(result.current.totalPrice).toBe(11000)
    })

    test('cambia el tamaño y su precio', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(papas, 1, [], { tamanioId: 1 }))

      act(() => result.current.reemplazarItem(result.current.items[0].id, papas, [], { tamanioId: 3 }))

      expect(result.current.items[0].tamanioId).toBe(3)
      expect(result.current.items[0].unitPrice).toBe(3500)
    })

    test('la línea editada queda en el mismo lugar', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))
      act(() => result.current.addItem(papas, 1))

      act(() =>
        result.current.reemplazarItem(result.current.items[0].id, hamburguesa, [], {
          personalizaciones: [{ insumoId: 2, cantidad: 0 }],
        }),
      )

      expect(result.current.items[0].product.id).toBe(hamburguesa.id)
      expect(result.current.items[1].product.id).toBe(papas.id)
    })

    test('si queda igual a otra línea, se juntan sumando cantidades', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))
      act(() =>
        result.current.addItem(hamburguesa, 1, [], { personalizaciones: [{ insumoId: 2, cantidad: 0 }] }),
      )

      // La personalizada vuelve a quedar como la común
      act(() => result.current.reemplazarItem(result.current.items[1].id, hamburguesa))

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
    })

    test('una línea que no existe no cambia nada', () => {
      const { result } = usarCarrito()
      act(() => result.current.addItem(hamburguesa, 1))
      const antes = result.current.items

      act(() => result.current.reemplazarItem('no-existe', papas))

      expect(result.current.items).toEqual(antes)
    })
  })
})