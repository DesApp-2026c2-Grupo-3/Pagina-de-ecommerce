import type { Pedido } from "./pedido.types"

export interface ViajeCreado {
  id: number
  repartidorId: number
  fechaInicio: string
  estado: string
}

export interface RespuestaIniciarViaje {
  mensaje: string
  viaje: ViajeCreado
  pedidoIds: number[]
}

export interface ViajeActivo extends ViajeCreado {
  fechaFin: string | null
  Pedidos: Pedido[]
}

export interface ViajeHistorial extends ViajeCreado {
  fechaFin: string | null
  Pedidos: Pedido[]
}