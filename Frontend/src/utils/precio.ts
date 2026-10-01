import type { ProductoBackend } from '../types/product'

// Ej: 5500 → "$5.500"
export function formatearPrecio(n: number) {
  return `$${n.toLocaleString('es-AR')}`
}

// Precio de un producto en el tamaño elegido (o su precio, si no tiene tamaños)
export function precioDe(producto: ProductoBackend, tamanio: string | null) {
  const variante = producto.variantes?.find((v) => v.tamanio === tamanio)
  return Number(variante?.precio ?? producto.precio)
}

// El precio más bajo, para mostrar "desde ..."
export function precioDesde(producto: ProductoBackend) {
  const precios = producto.variantes?.map((v) => Number(v.precio)) ?? []
  return precios.length > 0 ? Math.min(...precios) : Number(producto.precio)
}