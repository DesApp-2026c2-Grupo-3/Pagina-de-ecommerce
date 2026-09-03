import type { Product } from './product'

export interface CartItem {
  id: string          // id único de esta línea del carrito (producto + configuraciones)
  product: Product
  quantity: number
  selectedOptions: string[]  // ej: ["Extra ingredientes-Bacon", "Salsas-Ketchup"]
}