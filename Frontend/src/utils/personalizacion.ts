import type { ProductIngredient } from '../types/product'
import type { IngredientePersonalizacion } from '../types/cart'
import { formatearPrecio } from './precio'

// Lo que el cliente cambió de la receta: ingredientes quitados y extras sumados (por insumoId)
export interface Eleccion {
  quitados: Set<number>
  extras: Set<number>
}

// Cuánto suma un extra: 1 unidad, o la porción base si no es entera (ej. 0.5 kg)
export function pasoExtra(ing: ProductIngredient) {
  return Number.isInteger(ing.cantidadBase) ? 1 : ing.cantidadBase
}

// Cantidad final de un ingrediente. Si se quitó, no importa que esté marcado como extra
export function cantidadFinal(ing: ProductIngredient, { quitados, extras }: Eleccion) {
  if (quitados.has(ing.insumoId)) return 0
  return ing.cantidadBase + (extras.has(ing.insumoId) ? pasoExtra(ing) : 0)
}

// Los ingredientes que quedaron distintos a la receta
export function ingredientesTocados(ingredientes: ProductIngredient[], eleccion: Eleccion) {
  return ingredientes.filter((ing) => cantidadFinal(ing, eleccion) !== ing.cantidadBase)
}

// Lo que suman los extras. Quitar un ingrediente no descuenta
export function precioExtras(ingredientes: ProductIngredient[], eleccion: Eleccion) {
  return ingredientes.reduce(
    (suma, ing) => suma + Math.max(0, cantidadFinal(ing, eleccion) - ing.cantidadBase) * ing.precioComercial,
    0,
  )
}

// Texto para el carrito, ej: ["Sin Cebolla", "Extra Cheddar (+$500)"]
export function textoPersonalizacion(ingredientes: ProductIngredient[], eleccion: Eleccion) {
  return ingredientesTocados(ingredientes, eleccion).map((ing) => {
    const cantidad = cantidadFinal(ing, eleccion)
    if (cantidad === 0) return `Sin ${ing.nombre}`
    const costo = (cantidad - ing.cantidadBase) * ing.precioComercial
    return `Extra ${ing.nombre}${costo > 0 ? ` (+${formatearPrecio(costo)})` : ''}`
  })
}

// Lo que se guarda en el carrito y se manda al backend: solo los ingredientes tocados
export function personalizacionesDe(
  ingredientes: ProductIngredient[],
  eleccion: Eleccion,
): IngredientePersonalizacion[] {
  return ingredientesTocados(ingredientes, eleccion).map((ing) => ({
    insumoId: ing.insumoId,
    cantidad: cantidadFinal(ing, eleccion),
  }))
}

// El camino inverso: de lo guardado en el carrito a las casillas marcadas (para editar)
export function eleccionDesde(
  ingredientes: ProductIngredient[],
  personalizaciones: IngredientePersonalizacion[] = [],
): Eleccion {
  const quitados = new Set<number>()
  const extras = new Set<number>()

  for (const p of personalizaciones) {
    const ing = ingredientes.find((i) => i.insumoId === p.insumoId)
    if (!ing) continue
    if (p.cantidad === 0) quitados.add(ing.insumoId)
    else if (p.cantidad > ing.cantidadBase) extras.add(ing.insumoId)
  }

  return { quitados, extras }
}