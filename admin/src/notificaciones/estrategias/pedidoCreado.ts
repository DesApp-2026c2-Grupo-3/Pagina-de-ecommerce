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
import { PARAM_PEDIDO, PARAM_SUCURSAL } from '../../utils/navegacion/parametros'

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
  destino(notificacion: NotificacionDe<'pedido.creado'>) {
    const params = new URLSearchParams({
      [PARAM_PEDIDO]: String(notificacion.datos.pedidoId),
      [PARAM_SUCURSAL]: String(notificacion.datos.sucursalId),
    })

    return `/admin/pedidos?${params.toString()}`
  },
} satisfies EstrategiaNotificacion<'pedido.creado'>

export default estrategia
