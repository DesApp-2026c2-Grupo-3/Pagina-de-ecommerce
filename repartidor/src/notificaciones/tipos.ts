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
}

// Color semántico del aviso (plan UX, sección 6). Las clases viven en ./tonos.ts
export type TonoNotificacion = 'marca' | 'exito' | 'alerta' | 'peligro'

// Cómo se muestra cuando llega en vivo (toast, Fase UX-4)
export interface AvisoEnVivo<T extends TipoNotificacion> {
  // alta: toast más largo y anunciado como alerta
  prioridad: 'alta' | 'normal'
  textoAccion(notificacion: NotificacionDe<T>): string
}

// Strategy: todo lo propio de un tipo vive en su estrategia (agregar un tipo = un archivo)
export interface EstrategiaNotificacion<T extends TipoNotificacion> {
  tipo: T
  parsearDatos(valor: unknown): DatosDe<T> | null
  describir(notificacion: NotificacionDe<T>): DescripcionNotificacion
  destino(notificacion: NotificacionDe<T>): string
  icono: LucideIcon
  tono: TonoNotificacion
  // null: no genera toast, solo va a la bandeja
  aviso: AvisoEnVivo<T> | null
}
