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
    /** Solo con sucursal: si hay stock para la receta */
  hayStock?: boolean
  /** Solo con sucursal: si además alcanza para pedirlo extra */
  hayStockExtra?: boolean
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

/** Un tamaño de un producto, con su precio (ej: papas grandes $2600) */
export interface ProductoTamanio {
  tamanioId: number // id de la tabla Tamanios: 1 regular, 2 mediano, 3 grande
  tamanio: string // regular, mediano, grande
  precio: number | string // DECIMAL: Postgres lo devuelve como texto
  etiqueta: string | null // ej: "354 ml"
}

/** Solo combos: un lugar donde el cliente elige un producto (ej: Acompañamiento, Una bebida). */
export interface ComboGrupo {
  id: number
  nombre: string
  /** Se elige un producto de esta categoría */
  categoriaId: number
  /** Opción ya incluida en el precio del combo: las demás cobran la diferencia */
  productoIncluidoId: number
  obligatorio: boolean
  orden: number
  icono?: string | null
}

export interface ProductoBackend {
  id: number
  nombre: string
  descripcion: string
  precio: number
  imagen: string
  disponible: boolean
  categoriaId: number
  ingredientes?: ProductIngredient[]
  sabor?: string | null
  tamanios?: ProductoTamanio[]
  /** Solo combos: sus grupos elegibles. Si viene con elementos, el producto es un combo. */
  grupos?: ComboGrupo[]
}

export interface Category {
  id: number
  nombre: string
}
