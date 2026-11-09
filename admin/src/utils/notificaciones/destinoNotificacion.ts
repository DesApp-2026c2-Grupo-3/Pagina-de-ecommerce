import type { Notificacion } from '../../types/notificacion.types'
import {
  PARAM_BUSQUEDA,
  PARAM_PEDIDO,
  PARAM_SUCURSAL,
} from '../navegacion/parametros'

export function construirDestinoNotificacion(
  notificacion: Notificacion,
): string | null {
  switch (notificacion.tipo) {
    case 'pedido.creado': {
      const params = new URLSearchParams({
        [PARAM_PEDIDO]: String(notificacion.datos.pedidoId),
        [PARAM_SUCURSAL]: String(notificacion.datos.sucursalId),
      })
      return `/admin/pedidos?${params.toString()}`
    }

    case 'stock.bajo': {
      const nombre = notificacion.datos.insumoNombre.trim()
      if (!nombre) return null

      const params = new URLSearchParams({
        [PARAM_BUSQUEDA]: nombre,
      })
      return `/admin/sucursales/${notificacion.datos.sucursalId}/stock?${params.toString()}`
    }

    case 'sucursal.cerrada':
      return null
  }
}
