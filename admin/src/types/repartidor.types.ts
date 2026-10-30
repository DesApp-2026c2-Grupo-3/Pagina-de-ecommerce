export interface SucursalRepartidor {
  id: number
  nombre: string
}

export interface Repartidor {
  id: number
  nombre: string
  apellido: string
  email: string
  sucursalId: number
  activo: boolean
  createdAt: string
  sucursal?: SucursalRepartidor
}

export interface PayloadRepartidor {
  nombre: string
  apellido: string
  email: string
  password: string
  sucursalId: number
}