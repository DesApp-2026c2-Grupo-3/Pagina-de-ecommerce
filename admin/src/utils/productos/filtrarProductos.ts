import type { ProductoFila } from '../../types/producto.types'

export type FiltroDisponibilidad = 'todas' | 'habilitados' | 'inhabilitados'

export function esFiltroDisponibilidad(valor: unknown): valor is FiltroDisponibilidad {
  return valor === 'todas' || valor === 'habilitados' || valor === 'inhabilitados'
}

export interface FiltrosProductos {
  busqueda: string
  // 'todas' o el id de la categoría, como hoy (filtro exacto por categoriaId, D-P4)
  categoria: string
  disponibilidad: FiltroDisponibilidad
}

function coincideBusqueda(p: ProductoFila, busqueda: string): boolean {
  return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
}

function coincideCategoria(p: ProductoFila, categoria: string): boolean {
  return categoria === 'todas' || String(p.categoriaId) === categoria
}

function coincideDisponibilidad(p: ProductoFila, disponibilidad: FiltroDisponibilidad): boolean {
  return disponibilidad === 'todas' || (disponibilidad === 'habilitados') === p.disponible
}

// Misma lógica que tenía la página
export function filtrarProductos(productos: ProductoFila[], f: FiltrosProductos): ProductoFila[] {
  return productos.filter(
    (p) => coincideBusqueda(p, f.busqueda) && coincideCategoria(p, f.categoria) && coincideDisponibilidad(p, f.disponibilidad),
  )
}

// Contadores del filtro de disponibilidad, sobre la búsqueda y la categoría elegidas
export function contarPorDisponibilidad(
  productos: ProductoFila[],
  { busqueda, categoria }: Omit<FiltrosProductos, 'disponibilidad'>,
): Record<FiltroDisponibilidad, number> {
  const conteo: Record<FiltroDisponibilidad, number> = { todas: 0, habilitados: 0, inhabilitados: 0 }
  for (const p of productos) {
    if (!coincideBusqueda(p, busqueda) || !coincideCategoria(p, categoria)) continue
    conteo.todas += 1
    if (p.disponible) conteo.habilitados += 1
    else conteo.inhabilitados += 1
  }
  return conteo
}
