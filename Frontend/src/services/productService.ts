import { httpClient } from './httpClient'
import type { Product } from '../types/product'

// Shape real que devuelve el backend
interface ProductoBackend {
  id: number
  nombre: string
  descripcion: string
  precio: string | number
  imagen: string | null
  disponible: boolean
}

function mapProducto(p: ProductoBackend): Product {
  return {
    id: p.id,
    name: p.nombre,
    description: p.descripcion,
    category: '', // el backend no maneja categoría (lo vimos en el modelo)
    price: Number(p.precio),
    image: p.imagen ?? '',
    available: p.disponible,
  }
}

export const getProducts = async (): Promise<Product[]> => {
  const productos = await httpClient<ProductoBackend[]>('/productos')
  return productos.map(mapProducto)
}
//export const getCategories = async (): Promise<Category[]> => {
//  return httpClient<Category[]>('/categorias')
//}