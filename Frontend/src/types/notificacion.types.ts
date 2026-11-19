// Datos de los avisos de pedido (creado y cambio de estado tienen la misma forma)
export interface DatosPedido {
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
      datos: DatosPedido
    })
  | (BaseNotificacion & {
      tipo: 'pedido.estado_cambiado'
      datos: DatosPedido
    })
  | (BaseNotificacion & {
      tipo: 'sucursal.cerrada'
      datos: DatosSucursalCerrada
    })

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

// Una estrategia por tipo de aviso: cómo se valida, cómo se describe y adónde lleva
export interface EstrategiaNotificacionCliente<
  T extends NotificacionCliente = NotificacionCliente,
> {
  tipo: T['tipo']
  crear(base: BaseNotificacion, datos: unknown): T | null
  describir(notificacion: T): DescripcionNotificacionCliente
  obtenerDestino(notificacion: T): string | null
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

// Una carga que falló: «Reintentar» repite justo esa (plan, B-6)
export interface ErrorCargaNotificaciones {
  origen: 'inicial' | 'mas'
  mensaje: string
}

export interface EstadoNotificacionesCliente {
  items: NotificacionCliente[]
  noLeidas: number | null
  siguienteCursor: string | null
  cargandoInicial: boolean
  cargandoMas: boolean
  marcandoTodas: boolean
  errorCarga: ErrorCargaNotificaciones | null
  // Error de «marcar leída» o «marcar todas»: no se reintenta, se informa (plan, B-6 y B-7)
  errorAccion: string | null
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
  | { type: 'LECTURA_LOCAL_REVERTIR'; id: number; marca: string; mensaje: string }
  | { type: 'LECTURA_REMOTA'; evento: EventoNotificacionLeida }
  | { type: 'MARCAR_TODAS_INICIO' }
  | { type: 'MARCAR_TODAS_OK'; leidaEn: string }
  | { type: 'MARCAR_TODAS_ERROR'; mensaje: string }

export interface AccionesNotificacionesCliente {
  cargarMas: () => void
  marcarLeida: (id: number) => void
  marcarTodas: () => void
  reintentar: () => void
}
