import type { ProductoBackend } from './product'

export interface CartItem {
  id: string
  product: ProductoBackend
  quantity: number
}