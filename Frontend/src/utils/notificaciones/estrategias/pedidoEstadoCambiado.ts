import type {
  EstrategiaNotificacionCliente,
  NotificacionCliente,
} from '../../../types/notificacion.types'
import { destinoPedido, leerDatosPedido } from './datosPedido'

type NotificacionPedidoEstadoCambiado = Extract<
  NotificacionCliente,
  { tipo: 'pedido.estado_cambiado' }
>

// El backend no avisa los estados internos («Listo para retirar») y, si el anterior era
// interno, ya manda el que veía el cliente: acá no se filtra ni se traduce nada (plan, 36.6).
export const estrategiaPedidoEstadoCambiado: EstrategiaNotificacionCliente<NotificacionPedidoEstadoCambiado> = {
  tipo: 'pedido.estado_cambiado',
  crear(base, datos) {
    const pedido = leerDatosPedido(datos)
    return pedido ? { ...base, tipo: 'pedido.estado_cambiado', datos: pedido } : null
  },
  describir(notificacion) {
    const { pedidoId, estado, estadoAnterior } = notificacion.datos
    return {
      titulo: `Pedido #${pedidoId}: ${estado}`,
      detalle: estadoAnterior ? `Antes estaba en ${estadoAnterior}` : null,
      tono: 'estado',
    }
  },
  obtenerDestino(notificacion) {
    return destinoPedido(notificacion.datos.pedidoId)
  },
}
