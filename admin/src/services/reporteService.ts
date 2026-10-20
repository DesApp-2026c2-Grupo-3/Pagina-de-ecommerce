import type {
  ProductoMasVendido,
  ProductoMayorFacturacion,
  ProductoMenosVendido,
  ProductoSinStock,
} from '../types/reporte.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/reportes`

export async function obtenerProductosMasVendidos(): Promise<ProductoMasVendido[]> {
  return apiFetch(`${API}/productos-mas-vendidos`, {
    mensajePorDefecto: 'Error al obtener los productos más vendidos',
  })
}

//------------------------------------------------------

export async function obtenerProductosMenosVendidos(): Promise<ProductoMenosVendido[]> {
  return apiFetch(`${API}/productos-menos-vendidos`, {
    mensajePorDefecto: 'Error al obtener los productos menos vendidos',
  })
}

//---------------------------------------------------------

export async function obtenerProductosMayorFacturacion(): Promise<ProductoMayorFacturacion[]> {
  return apiFetch(`${API}/productos-mayor-facturacion`, {
    mensajePorDefecto: 'Error al obtener el reporte de facturación',
  })
}

//---------------------------------------------------------

export async function obtenerProductosSinStock(
  sucursalId?: number,
): Promise<ProductoSinStock[]> {
  const parametros = new URLSearchParams()

  if (sucursalId !== undefined) {
    parametros.set('sucursalId', String(sucursalId))
  }

  const query = parametros.toString()
  const url = `${API}/productos-sin-stock${query ? `?${query}` : ''}`

  return apiFetch(url, {
    mensajePorDefecto: 'Error al obtener los productos sin stock',
  })
}
