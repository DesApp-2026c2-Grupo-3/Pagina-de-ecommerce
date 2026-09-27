import { httpClient } from './httpClient'

// Sugerencia mientras el usuario escribe (/geo/autocompletar)
export interface GeoSugerencia {
  placeId: string
  principal: string // ej: "Florida 2950"
  secundario: string // ej: "Merlo, Provincia de Buenos Aires"
}

// Dirección completa (/geo/detalle y /geo/reverse)
export interface GeoResultado {
  direccionCompleta: string
  calle: string | null
  altura: number | null
  localidad: string | null
  departamento: string | null
  provincia: string | null
  codigoPostal: string | null
  latitud: number | null
  longitud: number | null
}

export const autocompletarDireccion = async (
  q: string,
  sessionToken: string,
): Promise<GeoSugerencia[]> => {
  const params = new URLSearchParams({ q, sessionToken })
  return httpClient<GeoSugerencia[]>(`/geo/autocompletar?${params}`)
}

export const detalleDireccion = async (
  placeId: string,
  sessionToken: string,
): Promise<GeoResultado> => {
  const params = new URLSearchParams({ sessionToken })
  return httpClient<GeoResultado>(`/geo/detalle/${encodeURIComponent(placeId)}?${params}`)
}

export const direccionDesdeCoordenadas = async (
  lat: number,
  lon: number,
): Promise<GeoResultado> => {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  return httpClient<GeoResultado>(`/geo/reverse?${params}`)
}
