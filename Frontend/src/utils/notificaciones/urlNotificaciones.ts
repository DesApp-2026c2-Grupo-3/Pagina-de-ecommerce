export const RUTA_NOTIFICACIONES_CLIENTE = '/notificaciones/cliente'
export const RUTA_CONTADOR_NO_LEIDAS = '/notificaciones/cliente/no-leidas/count'
export const RUTA_LEER_TODAS = '/notificaciones/cliente/leer-todas'

export interface OpcionesUrlNotificaciones {
  limite: number
  antesDe?: string | null
}

export function construirUrlNotificaciones({
  limite,
  antesDe,
}: OpcionesUrlNotificaciones): string {
  if (!Number.isInteger(limite) || limite < 1) {
    throw new Error('El límite debe ser un entero positivo')
  }

  const parametros = new URLSearchParams({ limite: String(limite) })
  if (antesDe) parametros.set('antesDe', antesDe)

  return `${RUTA_NOTIFICACIONES_CLIENTE}?${parametros.toString()}`
}

export function construirUrlMarcarLeida(id: number): string {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('El id de la notificación no es válido')
  }

  return `${RUTA_NOTIFICACIONES_CLIENTE}/${id}/leida`
}
