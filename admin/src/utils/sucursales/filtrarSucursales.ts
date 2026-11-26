import type { Sucursal } from '../../types/sucursal.types'

// Dos filtros directos, sin «Todas» (plan de Sucursales, D-SU1). Arranca en Activas.
export type FiltroEstadoSucursal = 'activas' | 'inactivas'

export function esFiltroEstadoSucursal(valor: unknown): valor is FiltroEstadoSucursal {
  return valor === 'activas' || valor === 'inactivas'
}

export interface FiltrosSucursales {
  busqueda: string
  estado: FiltroEstadoSucursal
}

// Misma búsqueda que tenía la página: por nombre
function coincideBusqueda(s: Sucursal, busqueda: string): boolean {
  return s.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
}

export function filtrarSucursales(lista: Sucursal[], { busqueda, estado }: FiltrosSucursales): Sucursal[] {
  return lista.filter((s) => coincideBusqueda(s, busqueda) && s.activa === (estado === 'activas'))
}

// Contadores de los dos botones, sobre la búsqueda
export function contarPorEstadoSucursal(lista: Sucursal[], busqueda: string): Record<FiltroEstadoSucursal, number> {
  const conteo: Record<FiltroEstadoSucursal, number> = { activas: 0, inactivas: 0 }
  for (const s of lista) {
    if (!coincideBusqueda(s, busqueda)) continue
    if (s.activa) conteo.activas += 1
    else conteo.inactivas += 1
  }
  return conteo
}

// «Av. Corrientes 1234 · CABA» con lo que haya; null si no hay dirección (D-SU3)
export function textoDireccion(s: Sucursal): string | null {
  const calle = [s.calle, s.numero].map((x) => (x ?? '').trim()).filter(Boolean).join(' ')
  const partes = [calle, (s.localidad ?? '').trim()].filter(Boolean)
  return partes.length ? partes.join(' · ') : null
}
