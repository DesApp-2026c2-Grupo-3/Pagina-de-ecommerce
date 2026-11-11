import type { Order } from '../../types/order'
import { normalizarEstado } from '../../config/pedidoEstados'
import { mapearNotificacion } from './mapearNotificacion'

export interface EventoPedidoCliente {
  tipo: 'pedido.creado' | 'pedido.estado_cambiado'
  pedidoId: number
  estado: string
  estadoAnterior: string | null
  ocurridoEn: string
}

export function leerEventoPedido(
  payload: unknown,
  usuarioId: number,
): EventoPedidoCliente | null {
  const notificacion = mapearNotificacion(payload)
  if (!notificacion || notificacion.tipo === 'sucursal.cerrada') return null
  if (notificacion.datos.usuarioId !== usuarioId) return null

  return {
    tipo: notificacion.tipo,
    pedidoId: notificacion.datos.pedidoId,
    estado: notificacion.datos.estado,
    estadoAnterior: notificacion.datos.estadoAnterior,
    ocurridoEn: notificacion.ocurridoEn,
  }
}

export function aplicarEventoPedido(
  pedido: Order,
  evento: EventoPedidoCliente,
): Order {
  if (pedido.id !== evento.pedidoId) return pedido

  const historial = [...(pedido.historialDeTiemposPedidos ?? [])]
  const ultimo = historial[historial.length - 1]

  if (ultimo) {
    const ultimaFecha = Date.parse(ultimo.fecha)
    const fechaEvento = Date.parse(evento.ocurridoEn)

    if (
      !Number.isNaN(ultimaFecha) &&
      !Number.isNaN(fechaEvento) &&
      fechaEvento < ultimaFecha
    ) {
      return pedido
    }
  }

  const yaRegistrado = historial.some(
    (registro) =>
      normalizarEstado(registro.estado) === normalizarEstado(evento.estado) &&
      registro.fecha === evento.ocurridoEn,
  )

  if (!yaRegistrado) {
    historial.push({ estado: evento.estado, fecha: evento.ocurridoEn })
  }

  return {
    ...pedido,
    estado: evento.estado,
    historialDeTiemposPedidos: historial,
  }
}
