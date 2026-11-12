import type { Notificacion } from './catalogo'
import { obtenerEstrategia } from './registro'
import type { DescripcionNotificacion } from './tipos'

export type { DescripcionNotificacion } from './tipos'

export function describirNotificacion(
  notificacion: Notificacion,
): DescripcionNotificacion {
  return obtenerEstrategia(notificacion.tipo).describir(notificacion)
}
