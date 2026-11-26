import type { Viaje } from '../../types/viaje.types'
import { useViajesSucursal } from './useViajesSucursal'

export type EstadoCargaViaje = 'cargando' | 'listo' | 'no-encontrado' | 'error'

// Detalle de un viaje con la lógica que ya existe (D-V1): se pide la lista de la sucursal
// (GET /admin/viajes/sucursal/:id) y se busca el viaje por id. Sin cambios en el backend.
// Si no está en esa sucursal, «no encontrado», sin revelar si existe en otra (RF-83).
export function useViajeDetalle(viajeId: number | null, sucursalId: number | null) {
  const datos = useViajesSucursal(viajeId === null ? null : sucursalId)
  const viaje: Viaje | null = datos.viajes.find((v) => v.id === viajeId) ?? null

  let carga: EstadoCargaViaje
  if (viajeId === null) carga = 'no-encontrado'
  else if (datos.cargando || sucursalId === null) carga = 'cargando'
  else if (viaje) carga = 'listo'
  else if (datos.errorCarga) carga = 'error'
  else carga = 'no-encontrado'

  return { viaje, carga, error: datos.errorCarga, recargar: datos.recargar }
}
