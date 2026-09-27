export interface Address {
  id: number
  alias: string
  calle: string
  numero: string
  piso?: string | null
  localidad: string
  provincia: string | null
  codigoPostal: string | null
  entreCalles: string | null
  observaciones: string | null
  // Postgres devuelve los DECIMAL como texto
  latitud: string | number | null
  longitud: string | number | null
  predeterminada: boolean
  usuarioId: number
}

export interface AddressFormData {
  alias: string
  calle: string
  numero: string
  piso: string
  localidad: string
  provincia: string
  codigoPostal: string
  entreCalles: string
  observaciones: string
  latitud: number | null
  longitud: number | null
  predeterminada: boolean
}