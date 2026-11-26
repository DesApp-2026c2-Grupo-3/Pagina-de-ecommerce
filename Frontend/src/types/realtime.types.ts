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

// «Volvé a cargar X» (plan, C-6): no se guarda ni va a la campana
export type DominioRefrescoCliente = 'pedido' | 'sucursal'

export interface RefrescoCliente {
  eventoId: string
  dominio: DominioRefrescoCliente
  accion: string
  // Dominio sucursal: cuál cambió
  sucursalId: number | null
  // Dominio pedido: cuál cambió
  pedidoId: number | null
}

export type EventoRealtimeCliente =
  | { tipo: 'notificacion'; payload: unknown }
  | { tipo: 'notificacion:leida'; payload: unknown }
  | { tipo: 'cliente:refresco'; refresco: RefrescoCliente }
  | { tipo: 'conexion'; estado: EstadoRealtimeCliente }
  | { tipo: 'reconexion' }
  // La pestaña volvió a primer plano
  | { tipo: 'visible' }
