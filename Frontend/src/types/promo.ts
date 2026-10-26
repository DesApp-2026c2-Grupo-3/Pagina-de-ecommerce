// Promociones tal como las devuelve GET /promociones (fuente: Backend/src/config/promociones.js)

export interface ItemPromo {
  nombre: string
  productoId: number
  cantidad: number
  /** 0.2 = 20 % menos, 0.5 = mitad de precio, 1 = gratis */
  descuento: number
}

export interface Promo {
  id: string
  titulo: string
  /** Lo grande del círculo: "2×1", "20%", "Gratis" */
  destacado: string
  detalle: string
  items: ItemPromo[]
  dias?: number[]
  maxPorPedido?: number
  /** El resto del pedido (sin esta promo) tiene que sumar al menos esto, en pesos */
  compraMinima?: number
}

export interface DiaPromos {
  dia: number // 0 = domingo … 6 = sábado
  nombre: string
  promos: Promo[]
}

export interface Promociones {
  hoy: number
  productoSemana: Promo | null
  regalo: Promo | null
  dias: DiaPromos[]
}
