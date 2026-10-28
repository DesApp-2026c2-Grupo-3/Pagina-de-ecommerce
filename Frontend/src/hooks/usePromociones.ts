import { useEffect, useState } from 'react'
import { getPromociones } from '../services/promotionService'
import { getProducts } from '../services/productService'
import { useCart } from '../context/CartContext'
import { useZona } from '../context/ZonaContext'
import { esPromoFija, resolverPromo } from '../utils/promosUtils'
import type { Promo, Promociones } from '../types/promo'
import type { ProductoBackend } from '../types/product'

// Se piden una sola vez por visita: las usan el Home, el catálogo, el detalle y la página de promos
let cache: Promise<Promociones> | null = null
const cargarPromociones = () => {
  cache ??= getPromociones().catch((error) => {
    cache = null
    throw error
  })
  return cache
}

/** Las promociones (null mientras cargan o si fallan) */
export function usePromociones() {
  const [promos, setPromos] = useState<Promociones | null>(null)
  useEffect(() => {
    let vivo = true
    cargarPromociones()
      .then((p) => vivo && setPromos(p))
      .catch(() => vivo && setPromos(null))
    return () => {
      vivo = false
    }
  }, [])
  return promos
}

/** Catálogo de la sucursal elegida, para armar las promos con precio y disponibilidad reales */
export function useCatalogo() {
  const { zona } = useZona()
  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let vivo = true
    setCargando(true)
    getProducts(zona?.sucursalId)
      .then((p) => vivo && setCatalogo(p))
      .catch(() => vivo && setCatalogo([]))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [zona?.sucursalId])
  return { catalogo, cargando }
}

/**
 * Suma la promo al carrito, cada producto con su descuento. Devuelve un mensaje de error si no se pudo
 * (producto sin stock, o una promo de "1 por pedido" que ya está en el carrito).
 */
export function useAgregarPromo(catalogo: ProductoBackend[]) {
  const { items, addItem } = useCart()

  return (promo: Promo): string | null => {
    const { lineas, disponible } = resolverPromo(promo, catalogo)
    if (!disponible) return 'Esta promo no está disponible en tu sucursal'
    if (promo.maxPorPedido && items.some((i) => i.promoId === promo.id)) {
      return `"${promo.titulo}" ya está en tu carrito`
    }
    const fija = esPromoFija(promo)
    for (const l of lineas) {
      addItem(l.producto, l.cantidad, [`Promo: ${promo.titulo}`], {
        tamanioId: l.tamanioId,
        combo: l.combo,
        unitPrice: l.precio,
        promoId: promo.id,
        descuento: l.descuento,
        precioLista: l.precioLista,
        promoFija: fija,
      })
    }
    return null
  }
}
