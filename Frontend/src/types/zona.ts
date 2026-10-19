export interface UbicacionElegida {
  calle: string
  numero: string
  localidad: string
  provincia: string
  codigoPostal: string
  latitud: number
  longitud: number
}

export interface Zona extends UbicacionElegida {
  sucursalId: number
  sucursalNombre: string
  distanciaKm: number
  sucursalAbierta: boolean
  sucursalZonaHoraria: string
}
