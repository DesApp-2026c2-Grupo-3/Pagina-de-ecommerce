import { ShoppingBag } from 'lucide-react'
import type {
  DatosPedidoCreado,
  NotificacionDe,
} from '../catalogo'
import {
  esRegistro,
  fechaIso,
  numero,
  numeroPositivo,
  texto,
} from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'
import {
  formatearImporte,
} from '../../utils/notificaciones/formatoNotificacion'
import { rutaDetallePedido } from '../../utils/navegacion/rutasPedido'

const estrategia = {
  tipo: 'pedido.creado',
  icono: ShoppingBag,
  clasesIcono: 'bg-orange-100 text-action',
  parsearDatos(valor: unknown): DatosPedidoCreado | null {
    if (!esRegistro(valor)) return null

    const pedidoId = numeroPositivo(valor.pedidoId)
    const usuarioId = numeroPositivo(valor.usuarioId)
    const sucursalId = numeroPositivo(valor.sucursalId)
    const estado = texto(valor.estado)
    const total = numero(valor.total)
    const fecha = fechaIso(valor.fecha)

    if (
      pedidoId === null
      || usuarioId === null
      || sucursalId === null
      || !estado
      || total === null
      || fecha === null
    ) {
      return null
    }

    return {
      pedidoId,
      usuarioId,
      sucursalId,
      estadoAnterior: null,
      estado,
      total,
      fecha,
    }
  },
  describir(notificacion: NotificacionDe<'pedido.creado'>) {
    return {
      titulo: `Pedido #${notificacion.datos.pedidoId} creado`,
      descripcion: `Ingresó un pedido por $${formatearImporte(notificacion.datos.total)}.`,
      detalle: `Estado: ${notificacion.datos.estado}`,
    }
  },
  // Lleva directo a la página del pedido, sin pasar por la cola de la lista (plan responsivo, 4.2)
  destino(notificacion: NotificacionDe<'pedido.creado'>) {
    return rutaDetallePedido(
      notificacion.datos.pedidoId,
      notificacion.datos.sucursalId,
    )
  },
} satisfies EstrategiaNotificacion<'pedido.creado'>

export default estrategia
