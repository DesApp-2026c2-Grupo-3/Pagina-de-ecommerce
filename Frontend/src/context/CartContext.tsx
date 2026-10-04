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
  reemplazarItem: (
    idViejo: string,
    product: ProductoBackend,
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

// El mismo producto con distinto tamaño o personalización va en líneas separadas.
// Ej: "12" (sin cambios), "40-grande", "12-5:0|8:2" (insumo 5 quitado, insumo 8 doble)
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

// Arma una línea del carrito: su id, su tamaño y su precio
function crearLinea(
  product: ProductoBackend,
  quantity: number,
  selectedOptions: string[] = [],
  options?: AddItemOptions,
): CartItem {
  // Si el producto tiene tamaños y no se eligió ninguno, va el primero (regular)
  const tamanio = options?.tamanio ?? ordenarVariantes(product.variantes)[0]?.tamanio ?? null
  const variante = product.variantes?.find((v) => v.tamanio === tamanio)

  return {
    id: buildItemId(product.id, tamanio, options?.personalizaciones),
    product,
    quantity,
    selectedOptions,
    tamanio,
    unitPrice: options?.unitPrice ?? Number(variante?.precio ?? product.precio),
    personalizaciones: options?.personalizaciones,
  }
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

    const linea = crearLinea(product, quantity, selectedOptions, options)

    setItems((prev) => {
      const existente = prev.find((item) => item.id === linea.id)
      if (existente) {
        return prev.map((item) =>
          item.id === linea.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prev, linea]
    })
  }

  // Cambia una línea por su versión editada, con la misma cantidad y en el mismo lugar.
  // Si queda igual a otra línea que ya existe, se juntan.
  function reemplazarItem(
    idViejo: string,
    product: ProductoBackend,
    selectedOptions: string[] = [],
    options?: AddItemOptions,
  ) {
    setItems((prev) => {
      const indice = prev.findIndex((item) => item.id === idViejo)
      if (indice === -1) return prev

      const linea = crearLinea(product, prev[indice].quantity, selectedOptions, options)
      const resto = prev.filter((item) => item.id !== idViejo)

      const igual = resto.find((item) => item.id === linea.id)
      if (igual) {
        return resto.map((item) =>
          item.id === linea.id ? { ...item, quantity: item.quantity + linea.quantity } : item,
        )
      }

      return [...resto.slice(0, indice), linea, ...resto.slice(indice)]
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
      value={{ items, addItem, reemplazarItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
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