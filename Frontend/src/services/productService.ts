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
  hayStock?: boolean
  hayStockExtra?: boolean
}

// GET /productos/:id = el producto de siempre + su receta, tal como viene del backend
type ProductoDetalleBackend = Omit<ProductoBackend, 'ingredientes'> & {
  ingredientes?: IngredienteBackend[]
}

// Con sucursalId, el backend calcula la disponibilidad con el stock de esa sucursal
const conSucursal = (ruta: string, sucursalId?: number | null) =>
  sucursalId ? `${ruta}?sucursalId=${sucursalId}` : ruta

export const getProducts = async (sucursalId?: number | null): Promise<ProductoBackend[]> => {
  return httpClient<ProductoBackend[]>(conSucursal('/productos', sucursalId))
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
    hayStock: i.hayStock,
    hayStockExtra: i.hayStockExtra,
  }
}

export const getProductoDetalle = async (id: number, sucursalId?: number | null): Promise<ProductoBackend> => {
  const producto = await httpClient<ProductoDetalleBackend>(conSucursal(`/productos/${id}`, sucursalId))
  return {
    ...producto,
    ingredientes: (producto.ingredientes ?? []).map(mapIngrediente),
  }
}

export const getCategories = async (): Promise<Category[]> => {
  const categorias = await httpClient<Category[]>('/categorias')  
  return categorias
}


// Ranking real: productos con más unidades pedidas (sin cancelados). Con sucursalId, solo esa sucursal.
export interface ProductoRanking {
  productoId: number
  vendidos: number
}

export const getMasPedidos = async (sucursalId?: number | null, limite = 4): Promise<ProductoRanking[]> => {
  const params = new URLSearchParams({ limite: String(limite) })
  if (sucursalId) params.set('sucursalId', String(sucursalId))
  return httpClient<ProductoRanking[]>(`/productos/mas-pedidos?${params}`)
}