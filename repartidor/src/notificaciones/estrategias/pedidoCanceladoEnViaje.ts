import { PackageX } from 'lucide-react'
import type { DatosPedidoCanceladoEnViaje, NotificacionDe } from '../catalogo'
import { esRegistro, numeroPositivo } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'

const estrategia = {
  tipo: 'pedido.cancelado_en_viaje',
  icono: PackageX,
  tono: 'peligro',
  aviso: {
    prioridad: 'alta',
    textoAccion: (notificacion: NotificacionDe<'pedido.cancelado_en_viaje'>) =>
      notificacion.datos.viajeEliminado ? 'Ver pedidos' : 'Ver viaje',
  },
  parsearDatos(valor: unknown): DatosPedidoCanceladoEnViaje | null {
    if (!esRegistro(valor)) return null

    const pedidoId = numeroPositivo(valor.pedidoId)
    const viajeId = numeroPositivo(valor.viajeId)
    if (pedidoId === null || viajeId === null) return null

    return { pedidoId, viajeId, viajeEliminado: valor.viajeEliminado === true }
  },
  describir(notificacion: NotificacionDe<'pedido.cancelado_en_viaje'>) {
    const { pedidoId, viajeEliminado } = notificacion.datos

    return {
      titulo: `Se canceló el pedido #${pedidoId}`,
      descripcion: viajeEliminado
        ? 'Era el único de tu viaje, así que el viaje se dio de baja.'
        : 'Ya no forma parte de tu viaje: no lo retires.',
    }
  },
  destino: (notificacion: NotificacionDe<'pedido.cancelado_en_viaje'>) =>
    notificacion.datos.viajeEliminado ? '/pedidos' : '/viaje',
} satisfies EstrategiaNotificacion<'pedido.cancelado_en_viaje'>

export default estrategia
