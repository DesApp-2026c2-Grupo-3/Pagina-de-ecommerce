import type { Notificacion } from '../notificaciones/catalogo'
import type { EstadoNotificaciones } from '../types/notificacion.types'
import { estadoInicial } from '../context/notificaciones/notificacionReducer'

export function viajeAsignado(id: number, ocurridoEn: string, leida = false): Notificacion {
  return {
    id,
    tipo: 'viaje.asignado',
    version: 1,
    ocurridoEn,
    leida,
    leidaEn: leida ? ocurridoEn : null,
    datos: { viajeId: 80 + id, cantidadPedidos: 3 },
  }
}

export function pedidoCancelado(id: number, ocurridoEn: string, viajeEliminado = false): Notificacion {
  return {
    id,
    tipo: 'pedido.cancelado_en_viaje',
    version: 1,
    ocurridoEn,
    leida: false,
    leidaEn: null,
    datos: { pedidoId: 1000 + id, viajeId: 87, viajeEliminado },
  }
}

export function estadoCon(cambios: Partial<EstadoNotificaciones>): EstadoNotificaciones {
  return { ...estadoInicial, cargandoInicial: false, ...cambios }
}
