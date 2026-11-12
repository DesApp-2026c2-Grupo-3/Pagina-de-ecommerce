export const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires'

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const

export type DiaSemana = (typeof DIAS_SEMANA)[number]

// Horas de 00:00 a 23:59 ("23:59" cuenta como el final del día).
// transnocheMin: minutos que la sucursal sigue abierta después de medianoche (opcional).
export interface HorarioDia {
  abierto: boolean
  apertura: string
  cierre: string
  transnocheMin?: number
}

export type HorarioSemana = Record<DiaSemana, HorarioDia>

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
  // Cierre temporal por contingencia que decide el encargado (el motivo no se muestra al cliente)
  cierreTemporal?: boolean
}
