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
  observaciones: string | null
  Usuario: ClientePedido
  Direccion: DireccionPedido | null
  DetallePedidos: DetallePedido[]
}