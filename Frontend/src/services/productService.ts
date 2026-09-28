import { httpClient } from './httpClient'
import type { Category, ProductIngredient, ProductoBackend } from '../types/product'

// Así llega cada insumo de la receta en GET /productos/:id
interface IngredienteBackend {
  insumoId: number
  nombre: string | null
  unidadMedida: string | null
  cantidadBase: number
  esRemovible: boolean
  esAgregable: boolean
  precioComercial: number
}

// GET /productos/:id = el producto de siempre + su receta, tal como viene del backend
type ProductoDetalleBackend = Omit<ProductoBackend, 'ingredientes'> & {
  ingredientes?: IngredienteBackend[]
}

export const getProducts = async (): Promise<ProductoBackend[]> => {
  const productos = await httpClient<ProductoBackend[]>('/productos')
  return productos
}

function mapIngrediente(i: IngredienteBackend): ProductIngredient {
  return {
    insumoId: i.insumoId,
    nombre: i.nombre ?? 'Insumo',
    unidadMedida: i.unidadMedida ?? '',
    cantidadBase: Number(i.cantidadBase),
    esRemovible: i.esRemovible,
    esAgregable: i.esAgregable,
    precioComercial: Number(i.precioComercial) || 0,
  }
}

// Detalle de un producto, incluyendo su receta (insumos removibles/agregables)
// para poder personalizarlo antes de agregarlo al carrito.
export const getProductoDetalle = async (id: number): Promise<ProductoBackend> => {
  const producto = await httpClient<ProductoDetalleBackend>(`/productos/${id}`)
  return {
    ...producto,
    ingredientes: (producto.ingredientes ?? []).map(mapIngrediente),
  }
}

export const getCategories = async (): Promise<Category[]> => {
  const categorias = await httpClient<Category[]>('/admin/categorias')
  return categorias
}