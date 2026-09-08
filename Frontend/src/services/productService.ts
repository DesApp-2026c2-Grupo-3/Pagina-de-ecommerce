import { httpClient } from './httpClient'
import { categories as categoriasMock, products as productosMock } from '../mocks/products'
import type { Category, Product } from '../types/product'

// Shape real que devuelve el backend
interface ProductoBackend {
  id: number
  nombre: string
  descripcion: string
  precio: string | number
  imagen: string | null
  disponible: boolean
}

// TEMPORAL: el modelo Producto del backend todavía no tiene columna "categoria"
// (ver Backend/src/models/producto.js) ni existe GET /categorias.
// Mientras tanto, como el seeder usa los mismos nombres que este mock,
// inferimos la categoría matcheando por nombre. Los productos nuevos que
// se carguen directo en el backend y no estén en este mapa van a caer en
// "Sin categoría" hasta que el backend sume el campo de verdad.
const categoriaPorNombre = new Map(productosMock.map((producto) => [producto.name, producto.category]))

function mapProducto(p: ProductoBackend): Product {
  return {
    id: p.id,
    name: p.nombre,
    description: p.descripcion,
    category: categoriaPorNombre.get(p.nombre) ?? 'Sin categoría',
    price: Number(p.precio),
    image: p.imagen ?? '',
    available: p.disponible,
  }
}

export const getProducts = async (): Promise<Product[]> => {
  const productos = await httpClient<ProductoBackend[]>('/productos')
  return productos.map(mapProducto)
}

// TEMPORAL: devuelve las categorías del mock hasta que exista GET /categorias.
export const getCategories = async (): Promise<Category[]> => {
  return categoriasMock
}