import type { Product } from './product'

/** Cantidad final elegida de un insumo de la receta (solo se incluyen los insumos tocados). */
export interface IngredientePersonalizacion {
  insumoId: number
  cantidad: number
}

export interface CartItem {
  id: string          // id único de esta línea del carrito (producto + configuraciones)
  product: Product
  quantity: number
  selectedOptions: string[]  // texto para mostrar, ej: ["Sin Cebolla", "Extra Queso x1 (+$500)"]
  unitPrice: number   // precio final de una unidad, ya con los extras de personalización sumados
  personalizaciones?: IngredientePersonalizacion[]  // insumos cuya cantidad final difiere de la receta base
}