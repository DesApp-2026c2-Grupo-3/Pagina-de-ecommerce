export interface ProductConfiguration {
  label: string
  options: string[]
}

/** Insumo de la receta de un producto, tal como lo devuelve el backend (GET /productos/:id). */
export interface ProductIngredient {
  insumoId: number
  nombre: string
  unidadMedida: string
  cantidadBase: number
  /** Ya viene incluido en el producto y se puede sacar. Sacarlo no cambia el precio. */
  esRemovible: boolean
  /** No viene incluido por defecto; se puede sumar como extra. Sumarlo cobra precioComercial. */
  esAgregable: boolean
  /** Lo que se le cobra de más al cliente por sumar una unidad de este insumo. */
  precioComercial: number
}

export interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  image: string
  available: boolean
  configurations?: ProductConfiguration[]
  /** Receta real del producto (insumos removibles/agregables). Solo viene en el detalle. */
  ingredients?: ProductIngredient[]
  /** Precio de lista sin descuento. Si está presente junto a discountLabel, se muestra tachado. */
  originalPrice?: number
  /** Texto corto para el badge circular de promo (ej: "-20%", "2x1", "Combo"). */
  discountLabel?: string
}

export interface ProductoBackend {
  id: number
  nombre: string
  descripcion: string
  precio: number
  imagen: string
  disponible: boolean
  categoriaId: number
  /** Receta real del producto (insumos removibles/agregables). Solo viene en el detalle. */
  ingredientes?: ProductIngredient[]
}

export interface Category {
  id: number
  nombre: string
}
