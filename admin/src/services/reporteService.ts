import type {
  ProductoMasVendido,
  ProductoMayorFacturacion,
  ProductoMenosVendido,
  ProductoSinStock,
  PedidoPorEstado,
  PedidoPorDia,
  PedidoPorSucursal,
  CancelacionPorDia,
  TiempoPromedioEntrega,
  ClienteMasPedidos,
  ClientesNuevosPorPeriodo,
  ClienteInactivo,
  PeriodoClientes,
  MesVentas,
  VentasPorSucursal,
  ProductosDeSucursal,
  PedidosAtendidosSucursal,
  PromocionMasUtilizada,
  ImpactoPromociones,
  PeriodoReporte,
} from '../types/reporte.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/reportes`

function construirUrlReporte(
  endpoint: string,
  sucursalId?: number,
  extras: Record<string, string> = {},
): string {
  const parametros = new URLSearchParams(extras)

  if (sucursalId !== undefined) {
    parametros.set('sucursalId', String(sucursalId))
  }

  const query = parametros.toString()

  return `${API}/${endpoint}${query ? `?${query}` : ''}`
}

// Parámetro de los botones de período: ?ultimos=7|30|365 (sin nada = histórico)
function conPeriodo(ultimos?: PeriodoReporte): Record<string, string> {
  return ultimos ? { ultimos: String(ultimos) } : {}
}

export async function obtenerProductosMasVendidos(
  sucursalId?: number,
  ultimos?: PeriodoReporte,
): Promise<ProductoMasVendido[]> {
  return apiFetch(construirUrlReporte('productos-mas-vendidos', sucursalId, conPeriodo(ultimos)), {
    mensajePorDefecto: 'Error al obtener los productos más vendidos',
  })
}

//------------------------------------------------------

export async function obtenerProductosMenosVendidos(
  sucursalId?: number,
  ultimos?: PeriodoReporte,
): Promise<ProductoMenosVendido[]> {
  return apiFetch(construirUrlReporte('productos-menos-vendidos', sucursalId, conPeriodo(ultimos)), {
    mensajePorDefecto: 'Error al obtener los productos menos vendidos',
  })
}

//------------------------------------------------------

export async function obtenerProductosMayorFacturacion(
  sucursalId?: number,
  ultimos?: PeriodoReporte,
): Promise<ProductoMayorFacturacion[]> {
  return apiFetch(construirUrlReporte('productos-mayor-facturacion', sucursalId, conPeriodo(ultimos)), {
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

//-----------------------------------------------


export async function obtenerPedidosPorSucursal(
  ultimos?: PeriodoReporte,
): Promise<PedidoPorSucursal[]> {
  return apiFetch(
    construirUrlReporte('pedidos-por-sucursal', undefined, conPeriodo(ultimos)),
    {
      mensajePorDefecto: 'Error al obtener los pedidos por sucursal',
    },
  )
}

//----------------------------------------------

export async function obtenerCancelacionesPorDia(
  sucursalId?: number
): Promise<CancelacionPorDia[]> {
  return apiFetch(
    construirUrlReporte('cancelaciones-por-dia', sucursalId),
    {
      mensajePorDefecto: 'Error al obtener las cancelaciones por día',
    }
  )
}

//-------------------------------------------------

export async function obtenerTiempoPromedioEntrega(
  sucursalId?: number
): Promise<TiempoPromedioEntrega> {
  return apiFetch(
    construirUrlReporte('tiempo-promedio-entrega', sucursalId),
    {
      mensajePorDefecto: 'Error al obtener el tiempo promedio de entrega',
    }
  )
}

//------------------------- CLIENTES -------------------------

export async function obtenerClientesMasPedidos(
  ultimos: PeriodoReporte,
  sucursalId?: number,
): Promise<ClienteMasPedidos[]> {
  return apiFetch(
    construirUrlReporte('clientes-mas-pedidos', sucursalId, conPeriodo(ultimos)),
    {
      mensajePorDefecto: 'Error al obtener los clientes con más pedidos',
    }
  )
}

export async function obtenerClientesNuevos(
  periodo: PeriodoClientes,
  sucursalId?: number,
): Promise<ClientesNuevosPorPeriodo[]> {
  return apiFetch(
    construirUrlReporte('clientes-nuevos', sucursalId, { periodo }),
    {
      mensajePorDefecto: 'Error al obtener los clientes nuevos',
    }
  )
}

export async function obtenerClientesInactivos(
  dias: number,
  sucursalId?: number,
): Promise<ClienteInactivo[]> {
  return apiFetch(
    construirUrlReporte('clientes-inactivos', sucursalId, { dias: String(dias) }),
    {
      mensajePorDefecto: 'Error al obtener los clientes inactivos',
    }
  )
}

//------------------------- SUCURSALES -------------------------

export async function obtenerVentasPorSucursal(
  mes: MesVentas,
): Promise<VentasPorSucursal> {
  return apiFetch(
    construirUrlReporte('ventas-por-sucursal', undefined, { mes }),
    {
      mensajePorDefecto: 'Error al obtener las ventas por sucursal',
    }
  )
}

export async function obtenerProductosPorSucursal(
  ultimos?: PeriodoReporte,
): Promise<ProductosDeSucursal[]> {
  return apiFetch(construirUrlReporte('productos-por-sucursal', undefined, conPeriodo(ultimos)), {
    mensajePorDefecto: 'Error al obtener los productos por sucursal',
  })
}

export async function obtenerPedidosAtendidosPorSucursal(): Promise<PedidosAtendidosSucursal[]> {
  return apiFetch(construirUrlReporte('pedidos-atendidos-por-sucursal'), {
    mensajePorDefecto: 'Error al obtener los pedidos atendidos por sucursal',
  })
}

//------------------------- PROMOCIONES -------------------------

export async function obtenerPromocionesMasUtilizadas(
  sucursalId?: number,
  ultimos?: PeriodoReporte,
): Promise<PromocionMasUtilizada[]> {
  return apiFetch(construirUrlReporte('promociones-mas-utilizadas', sucursalId, conPeriodo(ultimos)), {
    mensajePorDefecto: 'Error al obtener las promociones más utilizadas',
  })
}

export async function obtenerImpactoPromociones(
  sucursalId?: number,
): Promise<ImpactoPromociones> {
  return apiFetch(construirUrlReporte('impacto-promociones', sucursalId), {
    mensajePorDefecto: 'Error al obtener el impacto de las promociones',
  })
}