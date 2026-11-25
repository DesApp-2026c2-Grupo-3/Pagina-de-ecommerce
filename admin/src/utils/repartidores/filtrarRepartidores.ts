import type { Repartidor, SucursalRepartidor } from '../../types/repartidor.types'
import { coincideEstadoRepartidor, type FiltroEstadoRepartidor } from './estadoRepartidor'

export interface FiltrosRepartidores {
  busqueda: string
  // null = todas (solo el MASTER elige sucursal)
  sucursalId: number | null
  estado: FiltroEstadoRepartidor
}

export function nombreCompleto(r: Pick<Repartidor, 'nombre' | 'apellido'>): string {
  return `${r.nombre} ${r.apellido}`.trim()
}

// Por nombre, apellido o email (como antes)
export function coincideBusquedaRepartidor(r: Repartidor, busqueda: string): boolean {
  const texto = busqueda.trim().toLowerCase()
  return nombreCompleto(r).toLowerCase().includes(texto) || r.email.toLowerCase().includes(texto)
}

function coincideSucursal(r: Repartidor, sucursalId: number | null): boolean {
  return sucursalId === null || r.sucursalId === sucursalId
}

export function filtrarRepartidores(repartidores: Repartidor[], f: FiltrosRepartidores): Repartidor[] {
  return repartidores.filter(
    (r) => coincideBusquedaRepartidor(r, f.busqueda) && coincideSucursal(r, f.sucursalId) && coincideEstadoRepartidor(r, f.estado),
  )
}

// Contadores del filtro de estado, sobre lo que coincide con la búsqueda y la sucursal
export function contarPorEstadoRepartidor(
  repartidores: Repartidor[],
  { busqueda, sucursalId }: Omit<FiltrosRepartidores, 'estado'>,
): Record<FiltroEstadoRepartidor, number> {
  const conteo: Record<FiltroEstadoRepartidor, number> = { todos: 0, activos: 0, inactivos: 0, enViaje: 0 }
  for (const r of repartidores) {
    if (!coincideBusquedaRepartidor(r, busqueda) || !coincideSucursal(r, sucursalId)) continue
    conteo.todos += 1
    if (r.activo) conteo.activos += 1
    else conteo.inactivos += 1
    if (r.tieneViajeEnCurso) conteo.enViaje += 1
  }
  return conteo
}

// D-R1: las sucursales del filtro del MASTER salen de la lista (las que tienen repartidores)
export function sucursalesDeLaLista(repartidores: Repartidor[]): SucursalRepartidor[] {
  const porId = new Map<number, SucursalRepartidor>()
  for (const r of repartidores) if (r.sucursal) porId.set(r.sucursal.id, r.sucursal)
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
}
