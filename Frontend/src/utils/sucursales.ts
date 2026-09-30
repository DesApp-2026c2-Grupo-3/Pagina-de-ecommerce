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