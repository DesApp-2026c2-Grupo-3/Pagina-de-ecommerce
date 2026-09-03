import type { CartItem } from './cart'

export interface Order {
  id: number
  userId: number
  items: CartItem[]
  total: number
  date: string
}