// Promociones como las devuelve GET /admin/promociones (solo Admin-Master)

// SEMANA = producto de la semana, REGALO = regalo de la semana, DIA = promos de cada día
export type TipoPromo = 'SEMANA' | 'REGALO' | 'DIA'

export interface ItemPromoAdmin {
  productoId: number
  nombre: string | null
  /** Precio de lista del producto (el del tamaño regular si tiene tamaños) */
  precio: number | null
  cantidad: number
  /** 0.2 = 20 % menos, 0.5 = mitad de precio, 1 = gratis, 0 = precio de lista */
  descuento: number
  /** El producto fue eliminado: la promo no se muestra a los clientes hasta cambiarlo */
  eliminado: boolean
}

export interface PromocionAdmin {
  id: number
  tipo: TipoPromo
  titulo: string
  /** Lo grande del círculo: "2×1", "20%", "Gratis" */
  destacado: string
  detalle: string
  /** 0 = domingo … 6 = sábado (solo las promos del día) */
  dias: number[]
  maxPorPedido: number | null
  compraMinima: number | null
  activo: boolean
  /** false si algún producto fue eliminado */
  completa: boolean
  items: ItemPromoAdmin[]
}

// «Nuevo en la carta» no es una promo (es un producto elegido aparte, sin descuento),
// pero se lista con ellas para poder encontrarlo, editarlo o sacarlo de la página
export type TipoFilaPromo = TipoPromo | 'NUEVO'
// Por qué «Nuevo en la carta» no se ve bien en la tienda:
// categoría deshabilitada → el bloque no aparece; producto deshabilitado → aparece, pero no se puede comprar
export type AvisoNuevo = 'categoria-deshabilitada' | 'producto-deshabilitado'
export type FilaPromocion = Omit<PromocionAdmin, 'tipo'> & { tipo: TipoFilaPromo; aviso?: AvisoNuevo }
