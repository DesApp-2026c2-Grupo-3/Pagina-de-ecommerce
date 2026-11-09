export type TipoNotificacion =
  | 'pedido.creado'
  | 'sucursal.cerrada'
  | 'stock.bajo'

export interface DatosPedidoCreado {
  pedidoId: number
  usuarioId: number
  sucursalId: number
  estadoAnterior: null
  estado: string
  total: number
  fecha: string
}

export interface DatosSucursalCerrada {
  sucursalId: number
  sucursalNombre: string
}

export interface DatosStockBajo {
  sucursalId: number
  sucursalNombre: string
  insumoId: number
  insumoNombre: string
  cantidad: number
  stockMinimo: number | null
}

interface NotificacionBase {
  id: number
  version: number
  ocurridoEn: string
  leida: boolean
  leidaEn: string | null
}

export type Notificacion =
  | (NotificacionBase & {
      tipo: 'pedido.creado'
      datos: DatosPedidoCreado
    })
  | (NotificacionBase & {
      tipo: 'sucursal.cerrada'
      datos: DatosSucursalCerrada
    })
  | (NotificacionBase & {
      tipo: 'stock.bajo'
      datos: DatosStockBajo
    })

export interface PaginaNotificaciones {
  items: Notificacion[]
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

export interface EstadoNotificaciones {
  items: Notificacion[]
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

export type AccionNotificaciones =
  | { type: 'CARGA_INICIAL_INICIO' }
  | {
      type: 'CARGA_INICIAL_OK'
      items: Notificacion[]
      siguienteCursor: string | null
      noLeidas: number | null
    }
  | { type: 'CARGA_INICIAL_ERROR'; mensaje: string }
  | { type: 'CARGA_MAS_INICIO' }
  | {
      type: 'CARGA_MAS_OK'
      items: Notificacion[]
      siguienteCursor: string | null
    }
  | { type: 'CARGA_MAS_ERROR'; mensaje: string }
  | { type: 'CURSOR_DESCARTADO' }
  | { type: 'NUEVA_NOTIFICACION'; notificacion: Notificacion }
  | { type: 'LECTURA_LOCAL_OPTIMISTA'; id: number; marca: string }
  | { type: 'LECTURA_LOCAL_REVERTIR'; id: number; marca: string }
  | { type: 'LECTURA_REMOTA'; evento: EventoNotificacionLeida }
  | { type: 'MARCAR_TODAS_INICIO'; marca: string }
  | { type: 'MARCAR_TODAS_OK'; leidaEn: string }
  | { type: 'MARCAR_TODAS_ERROR'; mensaje: string }
  | { type: 'CONTADOR_ACTUALIZADO'; noLeidas: number | null }
  | { type: 'ERROR_ACTUALIZADO'; mensaje: string | null }

export interface AccionesNotificaciones {
  cargarMas: () => void
  marcarLeida: (id: number) => void
  marcarTodas: () => void
  reintentar: () => void
}
