import type { Repartidor } from './repartidor.types'

export interface SesionRepartidor {
  token: string
  repartidor: Repartidor
}

// POST /repartidor/login
export type RespuestaLogin = SesionRepartidor

// Por qué se cerró la sesión: se muestra en el login
// asistencia (D-24): quedó inactivo porque se reasignó el viaje en el que pidió ayuda
export type MotivoCierreSesion = 'desactivado' | 'baja' | 'asistencia' | 'expirada'
