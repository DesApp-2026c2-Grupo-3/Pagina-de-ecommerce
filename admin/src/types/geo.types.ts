// Sugerencia mientras se escribe
export interface GeoSugerencia {
  placeId: string
  principal: string // ej: "Florida 2950"
  secundario: string // ej: "Merlo, Provincia de Buenos Aires"
}

// Dirección completa
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
