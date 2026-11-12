import type { LucideIcon } from 'lucide-react'
import type { DatosDe, NotificacionDe, TipoNotificacion } from './catalogo'

export interface BaseNotificacion {
  id: number
  version: number
  ocurridoEn: string
  leida: boolean
  leidaEn: string | null
}

export interface DescripcionNotificacion {
  titulo: string
  descripcion: string
  detalle: string
}

export interface EstrategiaNotificacion<T extends TipoNotificacion> {
  tipo: T
  parsearDatos(valor: unknown): DatosDe<T> | null
  describir(notificacion: NotificacionDe<T>): DescripcionNotificacion
  destino(notificacion: NotificacionDe<T>): string | null
  icono: LucideIcon
  clasesIcono: string
}
