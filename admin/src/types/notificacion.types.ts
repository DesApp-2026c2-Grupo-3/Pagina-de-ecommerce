export interface Notificacion {
  id: number
  tipo: 'PARTE' | 'PARTE_RESUELTO' | 'CIERRE' | 'REAPERTURA'
  titulo: string
  mensaje: string
  parteId: number | null
  leida: boolean
  creada: string
}

export interface RespuestaNotificaciones {
  noLeidas: number
  items: Notificacion[]
}

export type TipoParte = 'EQUIPO' | 'INSUMO' | 'PEDIDO' | 'OTRO'
export type EstadoParte = 'ENVIADO' | 'VISTO' | 'RESUELTO'

type Persona = { id: number; nombre: string } | null

export interface Parte {
  id: number
  sucursalId: number
  tipo: TipoParte
  descripcion: string
  urgencia: 'NORMAL' | 'URGENTE'
  estado: EstadoParte
  pedidoId: number | null
  productos: { id: number; nombre: string }[]
  creadoPor: Persona
  creadoEn: string
  vistoPor: Persona
  vistoEn: string | null
  resueltoPor: Persona
  resueltoEn: string | null
  nota: string | null
}

export interface Perfil {
  id: number
  nombre: string
  email: string
  rol: 'MASTER' | 'ADMIN' | 'EMPLEADO'
  sucursal: { id: number; nombre: string } | null
  desde: string
  encargados: { id: number; nombre: string }[]
}
