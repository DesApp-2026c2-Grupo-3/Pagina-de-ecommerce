// Categorías como las devuelve GET /admin/categorias

export interface CategoriaAdmin {
  id: number
  nombre: string
  activo: boolean
  /** null = categoría principal (tarjeta del Home); si no, la categoría de la que cuelga */
  categoriaPadreId: number | null
  orden: number
  /** Ícono y color de la tarjeta del Home (null = los que corresponden al nombre) */
  icono: string | null
  fondo: string | null
  /** Productos que tiene (sin contar los eliminados) */
  cantidadProductos: number
}
