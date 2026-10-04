import type { ProductoBackend } from '../types/product'

// Ej: 5500 → "$5.500"
export function formatearPrecio(n: number) {
  return `$${n.toLocaleString('es-AR')}`
}

// Precio de un producto en el tamaño elegido (o su precio, si no tiene tamaños)
export function precioDe(producto: ProductoBackend, tamanioId: number | null) {
  const tamanio = producto.tamanios?.find((t) => t.tamanioId === tamanioId)
  return Number(tamanio?.precio ?? producto.precio)
}

// El precio más bajo, para mostrar "desde ..."
export function precioDesde(producto: ProductoBackend) {
  const precios = producto.tamanios?.map((t) => Number(t.precio)) ?? []
  return precios.length > 0 ? Math.min(...precios) : Number(producto.precio)
}