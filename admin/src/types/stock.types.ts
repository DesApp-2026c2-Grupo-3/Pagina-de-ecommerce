export interface ItemStock {
  id: number
  nombre: string
  cantidad: number
  stockMinimo: number | null
  bajoMinimo: boolean
  activo: boolean
}

export interface Movimiento {
  id: number
  fecha: string
  tipo: 'aumento' | 'baja' | 'venta' | 'devolucion'
  insumo: string
  cantidad: number
  motivo: string | null
  detalle: string | null
  admin: string | null
  pedidoId: number | null
}
