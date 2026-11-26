import type { SucursalStockProducto } from '../../types/producto.types'

export type FiltroStockProducto = 'todas' | 'con' | 'sin'

// Mismo criterio que el modal anterior: hay stock si se puede preparar al menos una unidad
export function tieneStock(s: SucursalStockProducto): boolean {
  return Boolean(s.unidades && s.unidades > 0)
}

function coincideNombre(s: SucursalStockProducto, busqueda: string): boolean {
  return s.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
}

export function filtrarStockProducto(
  sucursales: SucursalStockProducto[],
  { busqueda, estado }: { busqueda: string; estado: FiltroStockProducto },
): SucursalStockProducto[] {
  return sucursales.filter(
    (s) => coincideNombre(s, busqueda) && (estado === 'todas' || (estado === 'con') === tieneStock(s)),
  )
}

export function contarStockProducto(sucursales: SucursalStockProducto[], busqueda: string): Record<FiltroStockProducto, number> {
  const conteo: Record<FiltroStockProducto, number> = { todas: 0, con: 0, sin: 0 }
  for (const s of sucursales) {
    if (!coincideNombre(s, busqueda)) continue
    conteo.todas += 1
    if (tieneStock(s)) conteo.con += 1
    else conteo.sin += 1
  }
  return conteo
}
