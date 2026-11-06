import type { Pedido } from "./pedido.types"

export type EstadoViaje =
  | 'preparando'
  | 'activo'
  | 'requiere asistencia'
  | 'finalizado'
  | 'cancelado'

export type Motivo = 
  |'Problema con el vehículo'
  | 'Accidente' 
  | 'Problema personal' 
  | 'Otro'

export interface ViajeCreado {
  id: number
  repartidorId: number
  fechaInicio: string | null
  fechaFin?: string | null
  estado: EstadoViaje
}

export interface RespuestaIniciarViaje {
  mensaje: string
  viaje: ViajeCreado
  pedidoIds: number[]
}

export interface RespuestaCambioEstadoViaje {
  mensaje: string
  viaje: ViajeCreado
}

export interface ViajeActivo extends ViajeCreado {
  fechaFin: string | null
  motivoAsistencia: string | null
  comentarioAsistencia: string | null
  fechaSolicitudAsistencia: string | null
  Pedidos: Pedido[]
}

export interface ViajeHistorial extends ViajeCreado {
  fechaFin: string | null
  Pedidos: Pedido[]
}

export interface SolicitudAsistencia {
  motivo: Motivo
  comentario?: string
}

export interface RespuestaSolicitudAsistencia {
  mensaje: string
  viaje: {
    id: number
    estado: 'requiere asistencia'
    motivoAsistencia: string
    comentarioAsistencia: string | null
    fechaSolicitudAsistencia: string
  }
}