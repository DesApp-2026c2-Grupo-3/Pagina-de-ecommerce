import type { BaseNotificacion } from './tipos'

// Datos de cada tipo, tal como los arma su estrategia en el backend
export interface DatosViajeAsignado {
  viajeId: number
  cantidadPedidos: number
}

export interface DatosViajeReasignado {
  viajeId: number
}

export interface DatosPedidoCanceladoEnViaje {
  pedidoId: number
  viajeId: number
  viajeEliminado: boolean
}

export interface CatalogoNotificaciones {
  'viaje.asignado': DatosViajeAsignado
  'viaje.reasignado': DatosViajeReasignado
  'pedido.cancelado_en_viaje': DatosPedidoCanceladoEnViaje
}

export type TipoNotificacion = keyof CatalogoNotificaciones
export type DatosDe<T extends TipoNotificacion> = CatalogoNotificaciones[T]

export type NotificacionDe<T extends TipoNotificacion> = BaseNotificacion & {
  tipo: T
  datos: DatosDe<T>
}

export type Notificacion = {
  [K in TipoNotificacion]: NotificacionDe<K>
}[TipoNotificacion]
