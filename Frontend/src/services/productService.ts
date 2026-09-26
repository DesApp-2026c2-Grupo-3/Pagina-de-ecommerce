import { httpClient } from './httpClient'
import type { ProductoBackend, Category } from '../types/product'



export const getProducts = async (): Promise<ProductoBackend[]> => {
  const productos = await httpClient<ProductoBackend[]>('/productos')
  return productos
}


export const getCategories = async (): Promise<Category[]> => {
  const categorias = await httpClient<Category[]>('/admin/categorias')
  return categorias
}
