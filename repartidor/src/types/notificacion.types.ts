import type { Notificacion } from '../notificaciones/catalogo'

export interface PaginaNotificaciones {
  items: Notificacion[]
  siguienteCursor: string | null
}

export interface PaginaNotificacionesRemota {
  items: unknown[]
  siguienteCursor: unknown
}

export type EventoNotificacionLeida =
  | { notificacionId: number; leidaEn: string }
  | { todas: true; leidaEn: string }

export interface EstadoNotificaciones {
  items: Notificacion[]
  noLeidas: number | null
  siguienteCursor: string | null
  cargandoInicial: boolean
  cargandoMas: boolean
  // Error de la carga inicial (la bandeja muestra "Reintentar")
  error: string | null
  // Error al pedir avisos anteriores: no borra la lista que ya se ve
  errorCargaMas: string | null
  marcandoTodas: boolean
  // Lo necesario para deshacer "marcar todas" si el servidor falla
  respaldoMarcarTodas: { marca: string; noLeidas: number | null } | null
}

export type AccionNotificaciones =
  | { type: 'CARGA_INICIAL_INICIO' }
  | { type: 'CARGA_INICIAL_OK'; items: Notificacion[]; siguienteCursor: string | null; noLeidas: number | null }
  | { type: 'CARGA_INICIAL_ERROR'; mensaje: string }
  | { type: 'CARGA_MAS_INICIO' }
  | { type: 'CARGA_MAS_OK'; items: Notificacion[]; siguienteCursor: string | null }
  | { type: 'CARGA_MAS_ERROR'; mensaje: string }
  | { type: 'NUEVA_NOTIFICACION'; notificacion: Notificacion }
  // Optimista: se marca al instante con una marca de tiempo local; si falla, se revierte
  | { type: 'LECTURA_OPTIMISTA'; id: number; marca: string }
  | { type: 'LECTURA_REVERTIR'; id: number; marca: string }
  | { type: 'MARCAR_TODAS_INICIO'; marca: string }
  | { type: 'MARCAR_TODAS_OK'; leidaEn: string }
  | { type: 'MARCAR_TODAS_ERROR' }
  | { type: 'LECTURA_REMOTA'; evento: EventoNotificacionLeida }
  | { type: 'CONTADOR_ACTUALIZADO'; noLeidas: number | null }
  | { type: 'REINICIAR' }

export interface AccionesNotificaciones {
  cargarMas: () => void
  marcarLeida: (id: number) => void
  marcarTodas: () => void
  // Vuelve a hacer la carga inicial (botón "Reintentar" de la bandeja)
  reintentar: () => void
}
