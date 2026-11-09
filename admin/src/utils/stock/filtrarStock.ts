import type { ItemStock } from '../../types/stock.types'

interface OpcionesFiltrarStock {
  items: ItemStock[]
  busqueda: string
  filtroEstado: string
  objetivoId: number | null
}

export function filtrarStock({
  items,
  busqueda,
  filtroEstado,
  objetivoId,
}: OpcionesFiltrarStock) {
  const termino = busqueda.trim().toLowerCase()

  return items.filter((item) => {
    if (objetivoId !== null && item.id !== objetivoId) return false

    if (!item.nombre.toLowerCase().includes(termino)) return false

    if (filtroEstado === 'todos') return true
    if (filtroEstado === 'bajo') {
      return item.activo && item.cantidad > 0 && item.bajoMinimo
    }
    if (filtroEstado === 'sin') {
      return item.activo && item.cantidad <= 0
    }
    return filtroEstado === 'deshabilitado' && !item.activo
  })
}
