export interface PedidoDeViaje {
  id: number
  fecha: string
  estado: string
  total: number
  // D-07: cuándo el repartidor lo retiró del local (null si todavía no)
  retiradoEn: string | null
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
  // D-16 v2: con fecha si el repartidor fue dado de baja
  deletedAt: string | null
}

export type EstadoViaje =
  | 'preparando'
  | 'activo'
  | 'requiere asistencia'
  | 'finalizado'
  | 'cancelado'

// Filtro de la lista de viajes: todos o un estado en particular
export type FiltroEstadoViaje = 'todos' | EstadoViaje
export type ContadoresViaje = Record<FiltroEstadoViaje, number>

// Tono de la tarjeta: rojo mientras pide asistencia, ámbar unos segundos si es nuevo
export type TonoTarjeta = 'normal' | 'nuevo' | 'alerta'

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
// PATCH /viajes/:id/reasignar (D-22 / D-24)
export interface RespuestaReasignacion {
  mensaje: string
  viaje: {
    id: number
    repartidorId: number
    estado: EstadoViaje
    Repartidor: { id: number; nombre: string; apellido: string }
  }
  // Quien pidió la asistencia: queda inactivo hasta que un admin lo reactive
  repartidorAnterior: { id: number; nombre: string; apellido: string; activo: false }
}
