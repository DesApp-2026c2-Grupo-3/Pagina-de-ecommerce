export interface ProductConfiguration {
  label: string
  options: string[]
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
  /** Precio de lista sin descuento. Si está presente junto a discountLabel, se muestra tachado. */
  originalPrice?: number
  /** Texto corto para el badge circular de promo (ej: "-20%", "2x1", "Combo"). */
  discountLabel?: string
}

export interface Category {
  id: number
  name: string
  icon: string
}
