export interface Address {
  id: number
  alias: string
  calle: string
  numero: string
  piso?: string
  ciudad: string
  codigoPostal: string
  predeterminada: boolean
  usuarioId: number
}

export interface AddressFormData {
  alias: string
  calle: string
  numero: string
  piso?: string
  ciudad: string
  codigoPostal: string
  predeterminada: boolean
}