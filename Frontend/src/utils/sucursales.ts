import type { Sucursal } from '../types/sucursal'
import { distanciaKm } from './distancia'

export interface SucursalCercana {
  sucursal: Sucursal
  distancia: number // en km
  dentroDeZona: boolean // si la sucursal llega a ese punto
}

// La sucursal más cercana a un punto, y si el punto está dentro de su zona de entrega
export function buscarSucursalCercana(
  punto: { lat: number; lng: number } | null,
  sucursales: Sucursal[],
): SucursalCercana | null {
  if (!punto || sucursales.length === 0) return null

  const [masCercana] = sucursales
    .map((sucursal) => ({
      sucursal,
      distancia: distanciaKm(punto, { lat: sucursal.latitud, lng: sucursal.longitud }),
    }))
    .sort((a, b) => a.distancia - b.distancia)

  return {
    ...masCercana,
    dentroDeZona: masCercana.distancia <= masCercana.sucursal.radioEntregaKm,
  }
}


// Todas las sucursales que llegan a un punto, de la más cercana a la más lejana.
// Si el cliente está entre dos o tres, puede elegir en cuál comprar (por ejemplo, si a una le falta stock).
export function sucursalesEnRango(
  punto: { lat: number; lng: number } | null,
  sucursales: Sucursal[],
): SucursalCercana[] {
  if (!punto) return []

  return sucursales
    .map((sucursal) => {
      const distancia = distanciaKm(punto, { lat: sucursal.latitud, lng: sucursal.longitud })
      return { sucursal, distancia, dentroDeZona: distancia <= sucursal.radioEntregaKm }
    })
    .filter((opcion) => opcion.dentroDeZona)
    .sort((a, b) => a.distancia - b.distancia)
}


// La sucursal que prepara el pedido para ese punto: la preferida (la de la zona) si le llega; si no, la más cercana
export function sucursalParaEntrega(
  punto: { lat: number; lng: number } | null,
  sucursales: Sucursal[],
  preferidaId?: number | null,
): SucursalCercana | null {
  const preferida = sucursalesEnRango(punto, sucursales).find((o) => o.sucursal.id === preferidaId)
  return preferida ?? buscarSucursalCercana(punto, sucursales)
}