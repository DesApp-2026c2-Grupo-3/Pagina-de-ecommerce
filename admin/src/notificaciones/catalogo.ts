import type { BaseNotificacion } from './tipos'

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

export type BloqueSucursal =
  | 'datos_generales'
  | 'horarios'
  | 'ubicacion'
  | 'entrega'

export interface DatosSucursalModificadaPorAdmin {
  sucursalId: number
  sucursalNombre: string
  adminId: number
  adminNombre: string
  cambios: BloqueSucursal[]
}

export interface CatalogoNotificaciones {
  'pedido.creado': DatosPedidoCreado
  'sucursal.cerrada': DatosSucursalCerrada
  'stock.bajo': DatosStockBajo
  'sucursal.modificada_por_admin': DatosSucursalModificadaPorAdmin
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
