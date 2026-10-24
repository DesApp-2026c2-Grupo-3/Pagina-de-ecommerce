import type {
  ProductoMasVendido,
  ProductoMayorFacturacion,
  ProductoMenosVendido,
  ProductoSinStock,
  PedidoPorEstado,
  PedidoPorDia
} from '../types/reporte.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/reportes`

function construirUrlReporte(
  endpoint: string,
  sucursalId?: number,
): string {
  const parametros = new URLSearchParams()

  if (sucursalId !== undefined) {
    parametros.set('sucursalId', String(sucursalId))
  }

  const query = parametros.toString()

  return `${API}/${endpoint}${query ? `?${query}` : ''}`
}

export async function obtenerProductosMasVendidos(
  sucursalId?: number,
): Promise<ProductoMasVendido[]> {
  return apiFetch(construirUrlReporte('productos-mas-vendidos', sucursalId), {
    mensajePorDefecto: 'Error al obtener los productos más vendidos',
  })
}

//------------------------------------------------------

export async function obtenerProductosMenosVendidos(
  sucursalId?: number,
): Promise<ProductoMenosVendido[]> {
  return apiFetch(construirUrlReporte('productos-menos-vendidos', sucursalId), {
    mensajePorDefecto: 'Error al obtener los productos menos vendidos',
  })
}

//------------------------------------------------------

export async function obtenerProductosMayorFacturacion(
  sucursalId?: number,
): Promise<ProductoMayorFacturacion[]> {
  return apiFetch(construirUrlReporte('productos-mayor-facturacion', sucursalId), {
    mensajePorDefecto: 'Error al obtener el reporte de facturación',
  })
}

//------------------------------------------------------

export async function obtenerProductosSinStock(
  sucursalId?: number,
): Promise<ProductoSinStock[]> {
  return apiFetch(construirUrlReporte('productos-sin-stock', sucursalId), {
    mensajePorDefecto: 'Error al obtener los productos sin stock',
  })
}

//-------------------------------------------------------------

export async function obtenerPedidosPorEstado(
  sucursalId?: number,
): Promise<PedidoPorEstado[]> {
  return apiFetch(
    construirUrlReporte('pedidos-por-estado', sucursalId),
    {
      mensajePorDefecto: 'Error al obtener los pedidos por estado',
    },
  )
}

//----------------------------------------------------------


export async function obtenerPedidosPorDia(
  sucursalId?: number,
): Promise<PedidoPorDia[]> {
  return apiFetch(
    construirUrlReporte('pedidos-por-dia', sucursalId),
    {
      mensajePorDefecto: 'Error al obtener los pedidos por día',
    },
  )
}
