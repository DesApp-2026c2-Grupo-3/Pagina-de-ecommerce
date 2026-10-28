import type { Promo, Promociones } from '../types/promo'
import type { ComboElecciones } from '../types/cart'
import type { ProductoBackend } from '../types/product'
import { ordenarTamanios } from '../config/combo'
import { precioDe } from './precio'
import { eleccionPorDefecto, opcionesDeGrupo } from './comboOpciones'

/** Precio de una unidad con descuento, en pesos enteros (igual que el backend) */
export const conDescuento = (precio: number, descuento: number) => Math.round(precio * (1 - descuento))

/** Una promo con más de un producto, o de a varias unidades, va "cerrada": no se cambia la cantidad en el carrito */
export const esPromoFija = (promo: Promo) =>
  promo.items.length > 1 || promo.items.some((i) => i.cantidad > 1) || Boolean(promo.maxPorPedido)

export interface LineaPromo {
  producto: ProductoBackend
  cantidad: number
  descuento: number
  tamanioId: number | null
  combo?: ComboElecciones
  /** Precio de lista de una unidad (sin descuento) */
  precioLista: number
  /** Precio final de una unidad */
  precio: number
}

export interface PromoResuelta {
  lineas: LineaPromo[]
  totalLista: number
  total: number
  /** false si falta algún producto o no está disponible en la sucursal */
  disponible: boolean
}

// Arma las líneas de la promo con los productos del catálogo: tamaño más chico y, en combos, la opción incluida
export function resolverPromo(promo: Promo, catalogo: ProductoBackend[]): PromoResuelta {
  const lineas: LineaPromo[] = []
  let disponible = true

  for (const item of promo.items) {
    const producto = catalogo.find((p) => p.id === item.productoId)
    if (!producto || !producto.disponible) {
      disponible = false
      continue
    }
    const tamanioId = ordenarTamanios(producto.tamanios)[0]?.tamanioId ?? null
    const combo = producto.grupos?.length
      ? producto.grupos
          .map((g) => ({ grupoId: g.id, productoId: eleccionPorDefecto(g, opcionesDeGrupo(g, catalogo, tamanioId)) }))
          .filter((e): e is { grupoId: number; productoId: number } => e.productoId !== undefined)
      : undefined
    const precioLista = precioDe(producto, tamanioId)
    lineas.push({
      producto,
      cantidad: item.cantidad,
      descuento: item.descuento,
      tamanioId,
      combo,
      precioLista,
      precio: conDescuento(precioLista, item.descuento),
    })
  }

  return {
    lineas,
    totalLista: lineas.reduce((s, l) => s + l.precioLista * l.cantidad, 0),
    total: lineas.reduce((s, l) => s + l.precio * l.cantidad, 0),
    disponible: disponible && lineas.length > 0,
  }
}

/** Promo de hoy (o de la semana) que incluye a este producto, para la etiqueta del catálogo */
export function promoDelProducto(promos: Promociones | null, productoId: number): Promo | null {
  if (!promos) return null
  const deHoy = promos.dias.find((d) => d.dia === promos.hoy)?.promos ?? []
  const candidatas = [promos.productoSemana, ...deHoy].filter((p): p is Promo => Boolean(p))
  return candidatas.find((p) => p.items.some((i) => i.productoId === productoId && i.descuento > 0)) ?? null
}

/** "2× Fast Classic · 1× Coca Cola" */
export const resumenLineas = (lineas: LineaPromo[]) => lineas.map((l) => `${l.cantidad}× ${l.producto.nombre}`).join(' · ')
