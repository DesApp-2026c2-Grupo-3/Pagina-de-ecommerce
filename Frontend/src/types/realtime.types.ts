export type EstadoConexionCliente =
  | 'conectando'
  | 'conectado'
  | 'reconectando'
  | 'desconectado'

export interface EstadoRealtimeCliente {
  conexion: EstadoConexionCliente
  ultimaConexionEn: string | null
  ultimoError: string | null
}

export type EventoRealtimeCliente =
  | { tipo: 'notificacion'; payload: unknown }
  | { tipo: 'notificacion:leida'; payload: unknown }
  | { tipo: 'conexion'; estado: EstadoRealtimeCliente }
  | { tipo: 'reconexion' }
