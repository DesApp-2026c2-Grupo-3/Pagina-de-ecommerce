import type { Notificacion } from './catalogo'
import { obtenerEstrategia } from './registro'

export function construirDestinoNotificacion(
  notificacion: Notificacion,
): string | null {
  return obtenerEstrategia(notificacion.tipo).destino(notificacion)
}
