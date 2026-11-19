// Nombre accesible de la pestaña Pedidos cuando muestra cuántos hay para tomar
export function etiquetaPedidos(cantidad: number | null): string | undefined {
  if (cantidad === null || cantidad <= 0) return undefined
  return cantidad === 1 ? 'Pedidos, 1 disponible' : `Pedidos, ${cantidad} disponibles`
}
