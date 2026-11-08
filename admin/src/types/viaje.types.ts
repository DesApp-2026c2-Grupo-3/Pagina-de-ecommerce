export interface PedidoDeViaje {
  id: number
  fecha: string
  estado: string
  total: number
  Usuario: {
    id: number
    nombre: string
    apellido: string
  } | null
}

export interface RepartidorDeViaje {
  id: number
  nombre: string
  apellido: string
}

export type EstadoViaje =
  | 'preparando'
  | 'activo'
  | 'requiere asistencia'
  | 'finalizado'
  | 'cancelado'

export interface Viaje {
  id: number
  repartidorId: number
  fechaInicio: string | null
  fechaFin: string | null
  estado: EstadoViaje

  motivoAsistencia: string | null
  comentarioAsistencia: string | null
  fechaSolicitudAsistencia: string | null
  latitudAsistencia: string | number | null
  longitudAsistencia: string | number | null

  Repartidor: RepartidorDeViaje
  Pedidos: PedidoDeViaje[]
}