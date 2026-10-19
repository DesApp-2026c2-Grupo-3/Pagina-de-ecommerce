export const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires'

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const

export type DiaSemana = (typeof DIAS_SEMANA)[number]

export interface HorarioDia {
  apertura: string
  cierre: string
  abierto: boolean
}

export type HorarioSemana = Record<DiaSemana, HorarioDia>

export interface EstadoSucursal {
  abierta: boolean
  motivo: string | null
}

export interface Sucursal {
  id: number
  nombre: string
  calle: string
  numero: string | null
  localidad: string
  provincia: string
  codigoPostal: string | null
  telefono: string | null
  horario: HorarioSemana | string | null
  zona_horaria: string
  latitud: number
  longitud: number
  radioEntregaKm: number
}
