export interface DetallePedidoProducto {
  id: number
  nombre: string
  imagen: string | null
}

export interface DetallePedido {
  id: number
  cantidad: number
  precio: string
  productoId: number
  Producto: DetallePedidoProducto
}

export interface Order {
  id: number
  usuarioId: number
  direccionId: number | null
  fecha: string
  total: string
  estado: string
  DetallePedidos: DetallePedido[]
  Sucursal:{id: number, nombre:string}
  observaciones?: string | null;
  historialDeTiemposPedidos?: { estado: string; fecha: string }[]
  /** null si todavía no se calificó (lo manda el backend desde la Etapa 1) */
  calificacion?: { id: number } | null
    /** Envío cobrado (aparte de "total", que es solo productos). Llega como texto ("2100.00") */
  costoEnvio?: string | number
  /** Tiempo de entrega prometido al hacer el pedido */
  minutosEstimados?: number | null
  /** Solo pedidos en curso: hora aproximada de llegada (se corrige sola si hay demoras) */
  estimacion?: { llegaAprox: string; minutosRestantes: number; demorado: boolean } | null
}


// POST /pedido/cotizar: envío y tiempo antes de confirmar
export interface Cotizacion {
  distanciaKm: number
  dentroDelRadio: boolean
  radioEntregaKm: number
  costoEnvio: number
  minutosEstimados: number
}