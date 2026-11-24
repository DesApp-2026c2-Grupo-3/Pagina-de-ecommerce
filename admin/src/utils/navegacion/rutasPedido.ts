import { PARAM_SUCURSAL } from './parametros'

// Rutas del panel para pedidos (plan responsivo, 3.1)
export const RUTA_PEDIDOS = '/admin/pedidos'

function conSucursal(ruta: string, sucursalId?: number | null): string {
  if (!sucursalId) return ruta
  const params = new URLSearchParams({ [PARAM_SUCURSAL]: String(sucursalId) })
  return `${ruta}?${params.toString()}`
}

// /admin/pedidos/1042?sucursal=3 (`sucursal` solo le sirve al MASTER para volver)
export function rutaDetallePedido(pedidoId: number, sucursalId?: number | null): string {
  return conSucursal(`${RUTA_PEDIDOS}/${pedidoId}`, sucursalId)
}

export function rutaListaPedidos(sucursalId?: number | null): string {
  return conSucursal(RUTA_PEDIDOS, sucursalId)
}

// Estado de navegación que la lista pasa al detalle para restaurar filtros y página
export interface EstadoNavegacionPedido {
  desde: string
}

// A dónde vuelve el detalle: a la lista exacta de la que vino, o a la lista por defecto.
// El estado de navegación es dato externo: solo se acepta una ruta de la lista de pedidos.
export function destinoVolver(estado: unknown, sucursalId?: number | null): string {
  if (typeof estado === 'object' && estado !== null && 'desde' in estado) {
    const desde = (estado as { desde: unknown }).desde
    if (
      typeof desde === 'string' &&
      (desde === RUTA_PEDIDOS || desde.startsWith(`${RUTA_PEDIDOS}?`))
    ) {
      return desde
    }
  }
  return rutaListaPedidos(sucursalId)
}
