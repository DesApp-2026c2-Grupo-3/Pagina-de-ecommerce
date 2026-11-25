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

// Orígenes desde los que se llega al detalle de un pedido: la lista de pedidos
// o la página de un viaje (/admin/viajes/512, «Ver pedido»)
const ORIGEN_VIAJE = /^\/admin\/viajes\/\d+(\?.*)?$/

function esOrigenValido(desde: string): boolean {
  return desde === RUTA_PEDIDOS || desde.startsWith(`${RUTA_PEDIDOS}?`) || ORIGEN_VIAJE.test(desde)
}

// A dónde vuelve el detalle: a la pantalla exacta de la que vino, o a la lista por defecto.
// El estado de navegación es dato externo: solo se aceptan esas rutas del panel.
export function destinoVolver(estado: unknown, sucursalId?: number | null): string {
  if (typeof estado === 'object' && estado !== null && 'desde' in estado) {
    const desde = (estado as { desde: unknown }).desde
    if (typeof desde === 'string' && esOrigenValido(desde)) return desde
  }
  return rutaListaPedidos(sucursalId)
}

// Texto del enlace «Volver…» según a dónde lleva
export function etiquetaVolver(destino: string): string {
  const viaje = destino.match(/^\/admin\/viajes\/(\d+)/)
  return viaje ? `Volver al viaje #${viaje[1]}` : 'Volver a pedidos'
}
