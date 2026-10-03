import type { ProductoBackend } from './product'

/** Cantidad final elegida de un insumo de la receta (solo se incluyen los insumos tocados). */
export interface IngredientePersonalizacion {
  insumoId: number
  cantidad: number
}

/** Lo que eligió el cliente en un combo: qué producto puso en cada grupo (acompañamiento, bebida, ...). */
export type ComboElecciones = { grupoId: number; productoId: number }[]

export interface CartItem {
  id: string
  product: ProductoBackend
  quantity: number
  selectedOptions: string[]  // texto para mostrar, ej: ["Sin Cebolla", "Extra Queso x1 (+$500)"]
  unitPrice: number   // precio final de una unidad, ya con los extras de personalización sumados
  personalizaciones?: IngredientePersonalizacion[]  // insumos cuya cantidad final difiere de la receta base
  tamanio?: string | null  // nombre del tamaño elegido (regular, mediano, grande), si el producto tiene tamaños
  tamanioId?: number | null  // id del tamaño elegido (tabla Tamanios)
  combo?: ComboElecciones  // solo combos: lo que eligió el cliente
}