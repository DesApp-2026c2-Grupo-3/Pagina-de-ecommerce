import { categories, products } from '../mocks/products'
import type { Category, Product } from '../types/product'

// Por ahora devuelve los mocks. El día que conectemos al backend,
// esta función pasa a hacer un fetch/axios y nada más cambia afuera.
export const getProducts = async (): Promise<Product[]> => {
  return products
}

export const getCategories = async (): Promise<Category[]> => {
  return categories
}