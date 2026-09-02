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
}

export interface Category {
  id: number
  name: string
  icon: string
}
