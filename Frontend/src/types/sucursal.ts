export interface Sucursal {
  id: number
  nombre: string
  calle: string
  numero: string | null
  localidad: string
  provincia: string
  codigoPostal: string | null
  telefono: string | null
  horario: string | null
  latitud: number
  longitud: number
  radioEntregaKm: number
}
