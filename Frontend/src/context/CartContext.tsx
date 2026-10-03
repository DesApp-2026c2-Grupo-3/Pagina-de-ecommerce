import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ProductoBackend } from '../types/product'
import type { CartItem } from '../types/cart'
import { ordenarTamanios } from '../config/combo'

interface AddItemOptions {
  unitPrice?: number
  personalizaciones?: CartItem['personalizaciones']
  tamanioId?: number | null
  combo?: CartItem['combo']
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

// Ej: "12" (sin cambios), "40-t3" (tamaño 3), "12-5:0|8:2" (insumo 5 quitado, insumo 8 doble),
// "20-t2-c1:31,2:40" (combo con el producto 31 en el grupo 1 y el 40 en el grupo 2)
function buildItemId(
  productId: number,
  tamanioId: number | null,
  personalizaciones: CartItem['personalizaciones'] = [],
  combo?: CartItem['combo'],
) {
  let id = tamanioId ? `${productId}-t${tamanioId}` : String(productId)
  if (combo && combo.length > 0) {
    id += `-c${[...combo]
      .sort((a, b) => a.grupoId - b.grupoId)
      .map((e) => `${e.grupoId}:${e.productoId}`)
      .join(',')}`
  }
  if (personalizaciones.length === 0) return id
  const clave = [...personalizaciones]
    .sort((a, b) => a.insumoId - b.insumoId)
    .map((p) => `${p.insumoId}:${p.cantidad}`)
    .join('|')
  return `${id}-${clave}`
}

function leerCarritoGuardado(): CartItem[] {
  try {
    const guardado = localStorage.getItem(CART_STORAGE_KEY)
    const items = guardado ? JSON.parse(guardado) : []
    if (!Array.isArray(items)) return []

    return items
      // Descarta ítems guardados con el formato viejo de producto (sin "nombre", o con
      // "variantes" en vez de "tamanios"), que romperían el render del carrito o el pedido.
      .filter(
        (item: CartItem) =>
          item?.product && 'nombre' in item.product && !('variantes' in item.product),
      )
      // Descarta combos guardados con el formato anterior (acompanamientoId / bebidaId)
      .filter((item: CartItem) => !item.combo || Array.isArray(item.combo))
      // Un producto con tamaños tiene que tener elegido uno
      .filter((item: CartItem) => !item.product.tamanios?.length || item.tamanioId)
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

    // Si el producto tiene tamaños y no se eligió ninguno, va el primero (regular)
    const tamanioElegido = options?.tamanioId
      ? product.tamanios?.find((t) => t.tamanioId === options.tamanioId)
      : ordenarTamanios(product.tamanios)[0]
    const tamanio = tamanioElegido?.tamanio ?? null
    const tamanioId = tamanioElegido?.tamanioId ?? null
    const id = buildItemId(product.id, tamanioId, options?.personalizaciones, options?.combo)
    const unitPrice = options?.unitPrice ?? Number(tamanioElegido?.precio ?? product.precio)

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
          tamanio,
          tamanioId,
          combo: options?.combo,
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