import { promoCategories, promotions } from '../mocks/promotions'
import type { Category, Product } from '../types/product'

// Por ahora devuelve los mocks. El día que conectemos al backend,
// esta función pasa a hacer un fetch/axios y nada más cambia afuera.
export const getPromotions = async (): Promise<Product[]> => {
  return promotions
}

export const getPromoCategories = async (): Promise<Category[]> => {
  return promoCategories
}
