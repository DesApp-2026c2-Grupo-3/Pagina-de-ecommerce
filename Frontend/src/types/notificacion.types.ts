export type TipoNotificacionCliente =
  | 'pedido.creado'
  | 'pedido.estado_cambiado'
  | 'sucursal.cerrada'

export interface DatosPedidoCreado {
  pedidoId: number
  usuarioId: number
  sucursalId: number
  estadoAnterior: string | null
  estado: string
  total: number
  fecha: string
}

export interface DatosPedidoEstadoCambiado {
  pedidoId: number
  usuarioId: number
  sucursalId: number
  estadoAnterior: string | null
  estado: string
  total: number
  fecha: string
}

export interface DatosSucursalCerrada {
  sucursalId: number
  sucursalNombre: string
}

export interface BaseNotificacion {
  id: number
  version: 1
  ocurridoEn: string
  leida: boolean
  leidaEn: string | null
}

export type NotificacionCliente =
  | (BaseNotificacion & {
      tipo: 'pedido.creado'
      datos: DatosPedidoCreado
    })
  | (BaseNotificacion & {
      tipo: 'pedido.estado_cambiado'
      datos: DatosPedidoEstadoCambiado
    })
  | (BaseNotificacion & {
      tipo: 'sucursal.cerrada'
      datos: DatosSucursalCerrada
    })

export interface NotificacionRemota {
  id: number
  tipo: string
  version: number
  ocurridoEn: string
  datos: unknown
  destinos?: unknown
  leida?: boolean
  leidaEn?: string | null
}

export interface PaginaNotificacionesCliente {
  items: NotificacionCliente[]
  siguienteCursor: string | null
}

export interface PaginaNotificacionesRemota {
  items: unknown[]
  siguienteCursor: unknown
}

export interface EventoLeidaIndividual {
  notificacionId: number
  leidaEn: string
}

export interface EventoLeidaTodas {
  todas: true
  leidaEn: string
}

export type EventoNotificacionLeida =
  | EventoLeidaIndividual
  | EventoLeidaTodas

export type TonoNotificacionCliente = 'pedido' | 'estado' | 'sucursal'

export interface DescripcionNotificacionCliente {
  titulo: string
  detalle: string | null
  tono: TonoNotificacionCliente
}

export interface RespuestaMarcarLeida {
  ok: boolean
  notificacionId: number
  leidaEn: string
}

export interface RespuestaMarcarTodas {
  ok: boolean
  cantidad: number
  leidaEn: string
}

export interface EstadoNotificacionesCliente {
  items: NotificacionCliente[]
  noLeidas: number | null
  siguienteCursor: string | null
  cargandoInicial: boolean
  cargandoMas: boolean
  marcandoTodas: boolean
  error: string | null
  hayMas: boolean
  noLeidasAlMarcarTodas: number | null
  marcaMarcarTodas: string | null
}

export type AccionNotificacionesCliente =
  | { type: 'REINICIAR' }
  | { type: 'CARGA_INICIAL_INICIO' }
  | {
      type: 'CARGA_INICIAL_OK'
      items: NotificacionCliente[]
      siguienteCursor: string | null
      noLeidas: number | null
    }
  | { type: 'CARGA_INICIAL_ERROR'; mensaje: string }
  | { type: 'CARGA_MAS_INICIO' }
  | {
      type: 'CARGA_MAS_OK'
      items: NotificacionCliente[]
      siguienteCursor: string | null
    }
  | { type: 'CARGA_MAS_ERROR'; mensaje: string }
  | { type: 'CURSOR_DESCARTADO' }
  | { type: 'NUEVA_NOTIFICACION'; notificacion: NotificacionCliente }
  | { type: 'LECTURA_LOCAL_OPTIMISTA'; id: number; marca: string }
  | { type: 'LECTURA_LOCAL_REVERTIR'; id: number; marca: string }
  | { type: 'LECTURA_REMOTA'; evento: EventoNotificacionLeida }
  | { type: 'MARCAR_TODAS_INICIO'; marca: string }
  | { type: 'MARCAR_TODAS_OK'; leidaEn: string }
  | { type: 'MARCAR_TODAS_ERROR'; mensaje: string }
  | { type: 'CONTADOR_ACTUALIZADO'; noLeidas: number | null }
  | { type: 'ERROR_ACTUALIZADO'; mensaje: string | null }

export interface AccionesNotificacionesCliente {
  cargarMas: () => void
  marcarLeida: (id: number) => void
  marcarTodas: () => void
  reintentar: () => void
}
