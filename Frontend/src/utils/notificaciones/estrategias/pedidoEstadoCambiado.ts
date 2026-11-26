import type {
  DescripcionNotificacionCliente,
  EstrategiaNotificacionCliente,
  NotificacionCliente,
} from '../../../types/notificacion.types'
import { destinoPedido, leerDatosPedido } from './datosPedido'

type NotificacionPedidoEstadoCambiado = Extract<
  NotificacionCliente,
  { tipo: 'pedido.estado_cambiado' }
>

// Lo que le decimos al cliente en cada momento del pedido
function mensajeDelEstado(pedidoId: number, estado: string, motivo: string | null | undefined): DescripcionNotificacionCliente {
  switch (estado.trim().toLowerCase()) {
    case 'pendiente':
      return { titulo: `Tu pedido #${pedidoId} está esperando confirmación`, detalle: 'El local lo va a confirmar en unos minutos.', tono: 'pedido' }
    case 'en proceso':
      return { titulo: `Estamos preparando tu pedido #${pedidoId}`, detalle: 'Ya está en la cocina. Te avisamos cuando salga.', tono: 'cocina' }
    case 'en camino':
      return { titulo: `Tu pedido #${pedidoId} va en camino`, detalle: 'El repartidor ya salió. Estate atento para recibirlo.', tono: 'estado' }
    case 'entregado':
      return { titulo: `¡Entregamos tu pedido #${pedidoId}!`, detalle: 'Que lo disfrutes. Si querés, contanos qué te pareció.', tono: 'entregado' }
    case 'cancelado':
      return {
        titulo: `Cancelamos tu pedido #${pedidoId}`,
        detalle: motivo ? `Motivo: ${motivo}` : 'Si tenés dudas, comunicate con el local.',
        tono: 'cancelado',
      }
    default:
      return { titulo: `Tu pedido #${pedidoId} cambió de estado`, detalle: `Ahora está: ${estado}.`, tono: 'estado' }
  }
}

// El backend no avisa los estados internos («Listo para retirar») y, si el anterior era
// interno, ya manda el que veía el cliente: acá no se filtra ni se traduce nada (plan, 36.6).
export const estrategiaPedidoEstadoCambiado: EstrategiaNotificacionCliente<NotificacionPedidoEstadoCambiado> = {
  tipo: 'pedido.estado_cambiado',
  crear(base, datos) {
    const pedido = leerDatosPedido(datos)
    return pedido ? { ...base, tipo: 'pedido.estado_cambiado', datos: pedido } : null
  },
  describir(notificacion) {
    const { pedidoId, estado, motivo } = notificacion.datos
    return mensajeDelEstado(pedidoId, estado, motivo)
  },
  obtenerDestino(notificacion) {
    return destinoPedido(notificacion.datos.pedidoId)
  },
}