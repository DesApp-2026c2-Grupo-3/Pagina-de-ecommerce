import { PARAM_SUCURSAL } from './parametros'

// Rutas del panel para viajes (plan responsivo de Viajes, 3.1)
export const RUTA_VIAJES = '/admin/viajes'

function conSucursal(ruta: string, sucursalId?: number | null): string {
  if (!sucursalId) return ruta
  return `${ruta}?${new URLSearchParams({ [PARAM_SUCURSAL]: String(sucursalId) }).toString()}`
}

// /admin/viajes/512?sucursal=3 (`sucursal` solo la usa el MASTER)
export function rutaDetalleViaje(viajeId: number, sucursalId?: number | null): string {
  return conSucursal(`${RUTA_VIAJES}/${viajeId}`, sucursalId)
}

export function rutaListaViajes(sucursalId?: number | null): string {
  return conSucursal(RUTA_VIAJES, sucursalId)
}

// A dónde vuelve el detalle del viaje: a la lista exacta de la que vino (filtros y página)
// o a la lista por defecto. El estado de navegación es dato externo: solo se acepta la lista de viajes.
export function destinoVolverViaje(estado: unknown, sucursalId?: number | null): string {
  if (typeof estado === 'object' && estado !== null && 'desde' in estado) {
    const desde = (estado as { desde: unknown }).desde
    if (typeof desde === 'string' && (desde === RUTA_VIAJES || desde.startsWith(`${RUTA_VIAJES}?`))) {
      return desde
    }
  }
  return rutaListaViajes(sucursalId)
}
