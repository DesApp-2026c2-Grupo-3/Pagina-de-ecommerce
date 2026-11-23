import type { LucideIcon } from 'lucide-react'
import type { TonoNotificacion } from '../notificaciones/tipos'

// alta: 8 s y anunciado como alerta; normal: 4 s y anunciado como estado (plan UX, 7.3 y W-3)
export type PrioridadToast = 'alta' | 'normal'

export interface AccionToast {
  texto: string
  alTocar: () => void
}

export interface DatosToast {
  // Clave para no repetir: un mismo id no se muestra dos veces a la vez
  id: string
  tono: TonoNotificacion
  icono: LucideIcon
  titulo: string
  descripcion?: string
  prioridad: PrioridadToast
  accion?: AccionToast
}

export interface EstadoToasts {
  // El más nuevo primero (se dibuja arriba)
  visibles: DatosToast[]
  // Esperan a que se libere un lugar, en orden de llegada
  cola: DatosToast[]
}

export type AccionToasts =
  | { type: 'MOSTRAR'; toast: DatosToast }
  | { type: 'CERRAR'; id: string }
  | { type: 'VACIAR' }

export interface AccionesToasts {
  mostrar: (toast: DatosToast) => void
  cerrar: (id: string) => void
  vaciar: () => void
  // Un diálogo modal abierto se anota como capa: los toasts se dibujan dentro de él para
  // quedar por encima y seguir siendo tocables (fuera de un modal, todo queda inerte)
  registrarCapa: (elemento: HTMLElement) => () => void
}
