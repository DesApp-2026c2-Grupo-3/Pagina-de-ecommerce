export const RUTA_PRODUCTOS = '/admin/productos'

// :productoId y no :id (lo aprendido en Repartidores con los guards que leen :id)
export function rutaStockProducto(productoId: number): string {
  return `${RUTA_PRODUCTOS}/${productoId}/stock`
}

// «Volver a productos» vuelve a la lista con los filtros que tenía (dato externo: se valida)
export function destinoVolverProductos(estado: unknown): string {
  if (typeof estado === 'object' && estado !== null && 'desde' in estado) {
    const desde = (estado as { desde: unknown }).desde
    if (typeof desde === 'string' && (desde === RUTA_PRODUCTOS || desde.startsWith(`${RUTA_PRODUCTOS}?`))) return desde
  }
  return RUTA_PRODUCTOS
}
