// Producto como lo usa la lista del panel (GET /admin/productos trae más campos; acá van los que se muestran)
export interface ProductoFila {
  id: number
  nombre: string
  disponible: boolean
  categoriaId: number | null
  precio: number | string
  imagen: string | null
}

// GET /admin/productos/:id/stock: unidades que se pueden preparar en cada sucursal
export interface SucursalStockProducto {
  id: number
  nombre: string
  unidades: number | null
  limitante: string | null
}

export interface StockDeProducto {
  nombre: string
  sinReceta: boolean
  sucursales: SucursalStockProducto[]
}
