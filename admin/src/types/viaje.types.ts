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

export interface Viaje {
  id: number
  repartidorId: number
  fechaInicio: string
  fechaFin: string | null
  estado: 'activo' | 'finalizado'
  Repartidor: RepartidorDeViaje
  Pedidos: PedidoDeViaje[]
}