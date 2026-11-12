export type DominioRefresco =
  | 'stock'
  | 'pedidos'
  | 'productos'
  | 'sucursales'
  | 'reportes'

export type AccionRefresco =
  | 'creado'
  | 'actualizado'
  | 'eliminado'
  | 'estado_cambiado'

export interface RecursosRefresco {
  insumoId?: number
  pedidoId?: number
  productoId?: number
}

export interface EventoRefrescoAdmin {
  version: 1
  eventoId: string
  dominio: DominioRefresco
  accion: AccionRefresco
  ocurridoEn: string
  sucursalId: number | null
  recursos?: RecursosRefresco
}

export type EstadoConexionRealtime =
  | 'conectando'
  | 'conectado'
  | 'reconectando'
  | 'desconectado'

export interface EstadoRealtime {
  conexion: EstadoConexionRealtime
  ultimaConexionEn: string | null
  ultimoError: string | null
}

export type EventoRealtime =
  | { tipo: 'notificacion'; payload: unknown }
  | { tipo: 'notificacion:leida'; payload: unknown }
  | { tipo: 'admin:refresco'; payload: EventoRefrescoAdmin }
  | { tipo: 'conexion'; estado: EstadoRealtime }
  | { tipo: 'reconexion' }
