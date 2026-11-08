// Estado de un producto en una sucursal (GET /admin/suspensiones/sucursal/:id/productos)
export type EstadoProducto = 'disponible' | 'sin-stock' | 'suspendido' | 'deshabilitado'

export interface RegistroSuspension {
  id: number
  motivo: string
  desde: string
  por: { id: number; nombre: string } | null
}

export interface ProductoSucursal {
  id: number
  nombre: string
  categoriaId: number | null
  estado: EstadoProducto
  sinStock: boolean
  deshabilitadoGlobal: boolean // apagado por el master en todas las sucursales
  deshabilitadoEnSucursal: RegistroSuspension | null // deshabilitado por el master solo en esta sucursal
  suspension: RegistroSuspension | null // suspendido por el encargado
  puedeRehabilitar: boolean // si quien consulta puede levantar lo que tiene en esta sucursal
}

// Fila del registro (GET /admin/suspensiones)
export interface SuspensionRegistrada {
  id: number
  origen: 'ENCARGADO' | 'MASTER'
  motivo: string
  desde: string
  producto: { id: number; nombre: string } | null
  sucursal: { id: number; nombre: string } | null
  creadaPor: { id: number; nombre: string } | null
  rehabilitadaPor: { id: number; nombre: string } | null
  rehabilitadaEn: string | null
}
