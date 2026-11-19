import type {
  EstrategiaNotificacionCliente,
  NotificacionCliente,
} from '../../../types/notificacion.types'
import { formatearPrecio } from '../../precio'
import { destinoPedido, leerDatosPedido } from './datosPedido'

type NotificacionPedidoCreado = Extract<NotificacionCliente, { tipo: 'pedido.creado' }>

export const estrategiaPedidoCreado: EstrategiaNotificacionCliente<NotificacionPedidoCreado> = {
  tipo: 'pedido.creado',
  crear(base, datos) {
    const pedido = leerDatosPedido(datos)
    return pedido ? { ...base, tipo: 'pedido.creado', datos: pedido } : null
  },
  describir(notificacion) {
    return {
      titulo: `Pedido #${notificacion.datos.pedidoId} confirmado`,
      detalle: `Total ${formatearPrecio(notificacion.datos.total)}`,
      tono: 'pedido',
    }
  },
  obtenerDestino(notificacion) {
    return destinoPedido(notificacion.datos.pedidoId)
  },
}
