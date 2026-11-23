export const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires'

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const

export type DiaSemana = (typeof DIAS_SEMANA)[number]

export interface HorarioTurno {
  apertura: string
  cierre: string
  cruzaMedianoche: boolean
}

export interface HorarioDia {
  abierto: boolean
  turnos: HorarioTurno[]
}

export type HorarioSemana = Record<DiaSemana, HorarioDia>

export interface IntervaloTurno {
  inicio: number
  fin: number
}

export interface GrupoHorario {
  desde: DiaSemana
  hasta: DiaSemana
  config: HorarioDia
}

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
  horario: HorarioSemana
  zona_horaria: string
  latitud: number
  longitud: number
  radioEntregaKm: number
}
