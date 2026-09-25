import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ProductoBackend } from '../types/product'
import type { CartItem } from '../types/cart'

interface CartContextType {
  items: CartItem[]
  addItem: (product: ProductoBackend, quantity: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'cart'

function buildItemId(productId: number) {
  return String(productId)
}

function leerCarritoGuardado(): CartItem[] {
  try {
    const guardado = localStorage.getItem(CART_STORAGE_KEY)
    return guardado ? JSON.parse(guardado) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => leerCarritoGuardado())

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

function addItem(product: ProductoBackend, quantity: number) {
  const id = buildItemId(product.id)

  setItems((prev) => {
    const existing = prev.find((item) => item.id === id)

    if (existing) {
      return prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      )
    }

    return [...prev, { id, product, quantity }]
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
  const totalPrice = items.reduce((sum, item) => sum + Number(item.product.precio) * item.quantity, 0)

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