export interface ProductoPedido {
  id: number
  nombre: string
  imagen: string | null
}

export interface DetallePedido {
  id: number
  cantidad: number
  precio: number
  Producto: ProductoPedido
}

export interface DireccionPedido {
  id: number
  alias: string | null
  calle: string
  numero: string
  piso: string | null
  localidad: string
  provincia: string
  observaciones: string | null
  latitud: string | number | null
  longitud: string | number | null
}

export interface ClientePedido {
  id: number
  nombre: string
  apellido: string
  telefono: string
}

export interface Pedido {
  id: number
  fecha: string
  total: number | string
  estado: string
  // D-07: cuándo lo retiró el repartidor del local (el estado no cambia hasta iniciar el viaje)
  retiradoEn: string | null
  observaciones: string | null
  Usuario: ClientePedido
  Direccion: DireccionPedido | null
  DetallePedidos: DetallePedido[]
}
// PATCH /repartidor/pedidos/:pedidoId/retirar
export interface RespuestaRetirarPedido {
  mensaje: string
  pedido: {
    id: number
    estado: string
    retiradoEn: string
  }
}

// PATCH /repartidor/pedidos/:pedidoId/entregar
export interface RespuestaEntregarPedido {
  mensaje: string
  pedido: {
    id: number
    estado: string
  }
  viajeFinalizado: boolean
}
