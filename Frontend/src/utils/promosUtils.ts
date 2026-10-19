import type { Promo } from '../config/promosConfig'
import type { ComboElecciones } from '../types/cart'
import type { ProductoBackend } from '../types/product'
import { ordenarTamanios } from '../config/combo'
import { precioDe } from './precio'

// "Dúo Carnívoro" y "duo carnivoro" son el mismo nombre
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

export interface LineaPromo {
  producto: ProductoBackend
  cantidad: number
  combo?: ComboElecciones
}

export interface PromoResuelta {
  lineas: LineaPromo[]
  /** Suma de los precios reales de lo que se agrega (lo que cobra el carrito) */
  total: number
  /** false si falta algún producto o no está disponible en la sucursal */
  disponible: boolean
}

// Un combo va al carrito con la opción incluida de cada lugar (la que no cobra extra)
function eleccionPorDefecto(combo: ProductoBackend, catalogo: ProductoBackend[]): ComboElecciones {
  return (combo.grupos ?? []).map((g) => {
    const incluido = catalogo.find((p) => p.id === g.productoIncluidoId && p.disponible)
    const alternativo = catalogo.find((p) => p.categoriaId === g.categoriaId && p.disponible)
    return { grupoId: g.id, productoId: (incluido ?? alternativo ?? { id: g.productoIncluidoId }).id }
  })
}

export function resolverPromo(promo: Promo, catalogo: ProductoBackend[]): PromoResuelta {
  const porNombre = new Map(catalogo.map((p) => [normalizar(p.nombre), p]))
  const lineas: LineaPromo[] = []
  let disponible = true

  for (const item of promo.items) {
    // El primer nombre de la lista que exista y esté disponible; si ninguno, el primero que exista
    const candidatos = item.nombres.map((n) => porNombre.get(normalizar(n))).filter((p): p is ProductoBackend => !!p)
    const producto = candidatos.find((p) => p.disponible) ?? candidatos[0]
    if (!producto || !producto.disponible) {
      disponible = false
      continue
    }
    lineas.push({
      producto,
      cantidad: item.cantidad,
      combo: producto.grupos?.length ? eleccionPorDefecto(producto, catalogo) : undefined,
    })
  }

  const total = lineas.reduce((suma, l) => {
    const tamanioId = ordenarTamanios(l.producto.tamanios)[0]?.tamanioId ?? null
    return suma + Number(precioDe(l.producto, tamanioId)) * l.cantidad
  }, 0)

  return { lineas, total, disponible }
}

// "2× Fast Classic · 1× Coca Cola"
export function resumenLineas(lineas: LineaPromo[]) {
  return lineas.map((l) => `${l.cantidad}× ${l.producto.nombre}`).join(' · ')
}