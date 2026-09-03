const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

import type { CartItem } from '../types/cart'
import type { Order } from '../types/order'

let orderIdCounter = 1

export const createOrder = async (
  userId: number,
  items: CartItem[],
  total: number,
): Promise<Order> => {
  await delay(500)

  const order: Order = {
    id: orderIdCounter++,
    userId,
    items,
    total,
    date: new Date().toISOString(),
  }

  return order
}