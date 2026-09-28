import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ProductoBackend } from '../types/product'
import type { CartItem } from '../types/cart'

interface AddItemOptions {
  unitPrice?: number
  personalizaciones?: CartItem['personalizaciones']
}

interface CartContextType {
  items: CartItem[]
  addItem: (
    product: ProductoBackend,
    quantity: number,
    selectedOptions?: string[],
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

// El mismo producto con distinta personalización va en líneas separadas del carrito.
// Ej: "12" (sin cambios), "12-5:0|8:2" (insumo 5 quitado, insumo 8 doble)
function buildItemId(productId: number, personalizaciones: CartItem['personalizaciones'] = []) {
  if (personalizaciones.length === 0) return String(productId)
  const clave = [...personalizaciones]
    .sort((a, b) => a.insumoId - b.insumoId)
    .map((p) => `${p.insumoId}:${p.cantidad}`)
    .join('|')
  return `${productId}-${clave}`
}

function leerCarritoGuardado(): CartItem[] {
  try {
    const guardado = localStorage.getItem(CART_STORAGE_KEY)
    const items = guardado ? JSON.parse(guardado) : []
    if (!Array.isArray(items)) return []

    return items
      // Descarta ítems guardados con el formato viejo de producto (sin "nombre"),
      // que romperían el render del carrito.
      .filter((item: CartItem) => item?.product && 'nombre' in item.product)
      // Completa campos que pueden faltar en carritos de versiones anteriores
      .map((item: CartItem) => ({
        ...item,
        selectedOptions: item.selectedOptions ?? [],
        unitPrice:
          typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.product.precio) || 0,
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
    product: ProductoBackend,
    quantity: number,
    selectedOptions: string[] = [],
    options?: AddItemOptions,
  ) {
    // Un producto no disponible nunca entra al carrito, venga de donde venga
    if (!product.disponible) return

    const id = buildItemId(product.id, options?.personalizaciones)
    const unitPrice = options?.unitPrice ?? Number(product.precio)

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