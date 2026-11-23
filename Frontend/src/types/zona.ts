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
  // La sucursal anterior, si la zona se pasó sola a esta porque aquella se desactivó (DC-12).
  // Se borra cuando el cliente cierra el aviso o elige otra.
  sucursalAnterior?: string
}
