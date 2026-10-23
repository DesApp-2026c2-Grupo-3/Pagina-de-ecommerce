export interface ProductoMasVendido {
  productoId: number
  unidadesVendidas: string | number
  Producto: {
    nombre: string
    imagen: string | null
  }
}

export interface ProductoMenosVendido {
  productoId: number
  nombre: string
  imagen: string | null
  unidadesVendidas: string | number
}

export interface ProductoMayorFacturacion {
  productoId: number
  nombre: string
  imagen: string | null
  facturacion: string | number
}

export interface ProductoSinStock {
  productoId: number
  nombre: string
  imagen: string | null
  sucursalId: number
  sucursalNombre: string
  unidadesDisponibles: number
  insumoLimitante: string | null
}

export interface PedidoPorEstado {
  estado: string
  cantidad: number
}