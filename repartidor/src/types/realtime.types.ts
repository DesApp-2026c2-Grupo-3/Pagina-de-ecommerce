export type DominioRefresco = 'pedidos_disponibles' | 'viaje'

export type AccionRefresco =
  | 'creado'
  | 'actualizado'
  | 'eliminado'
  | 'estado_cambiado'

export interface RecursosRefresco {
  pedidoId?: number
  viajeId?: number
}

// Evento `repartidor:refresco`: no se guarda, solo avisa "volvé a cargar X"
export interface EventoRefrescoRepartidor {
  version: 1
  eventoId: string
  dominio: DominioRefresco
  accion: AccionRefresco
  ocurridoEn: string
  sucursalId: number
  recursos?: RecursosRefresco
  // Repartidor que provocó el cambio (p. ej. quien quitó el pedido de su viaje): a él no
  // se le muestra el aviso, aunque su lista y su contador sí se actualizan (v1.7, D-21)
  origenRepartidorId?: number
}

export type EstadoRealtime =
  | 'desconectado'
  | 'conectando'
  | 'conectado'
  | 'reconectando'

export type EventoRealtime =
  | { tipo: 'notificacion'; payload: unknown }
  | { tipo: 'notificacion:leida'; payload: unknown }
  | { tipo: 'repartidor:refresco'; payload: EventoRefrescoRepartidor }
  | { tipo: 'conexion'; estado: EstadoRealtime }
  | { tipo: 'reconexion' }
  // La pestaña volvió a primer plano (W-1): hay que recargar los datos
  | { tipo: 'visible' }
