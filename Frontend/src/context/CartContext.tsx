import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '../types/product'
import type { CartItem } from '../types/cart'

interface AddItemOptions {
  unitPrice?: number
  personalizaciones?: CartItem['personalizaciones']
}

interface CartContextType {
  items: CartItem[]
  addItem: (
    product: Product,
    quantity: number,
    selectedOptions: string[],
    options?: AddItemOptions,
  ) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'cart'

function buildItemId(productId: number, selectedOptions: string[]) {
  return `${productId}-${[...selectedOptions].sort().join('|')}`
}

function leerCarritoGuardado(): CartItem[] {
  try {
    const guardado = localStorage.getItem(CART_STORAGE_KEY)
    const items = guardado ? JSON.parse(guardado) : []
    if (!Array.isArray(items)) return []

    // Normaliza carritos guardados con una versión anterior (sin unitPrice/selectedOptions),
    // para no romper el render si alguien tiene algo viejo en el localStorage del navegador.
    return items.map((item: CartItem) => ({
      ...item,
      selectedOptions: item.selectedOptions ?? [],
      unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : item.product?.price ?? 0,
    }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => leerCarritoGuardado())

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(
    product: Product,
    quantity: number,
    selectedOptions: string[],
    options?: AddItemOptions,
  ) {
    const id = buildItemId(product.id, selectedOptions)
    const unitPrice = options?.unitPrice ?? product.price

    setItems((prev) => {
      const existing = prev.find((item) => item.id === id)
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [
        ...prev,
        {
          id,
          product,
          quantity,
          selectedOptions,
          unitPrice,
          personalizaciones: options?.personalizaciones,
        },
      ]
    })
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}