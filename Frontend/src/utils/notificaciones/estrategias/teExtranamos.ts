import type {
  EstrategiaNotificacionCliente,
  NotificacionCliente,
} from '../../../types/notificacion.types'
import { esRegistro, numeroPositivo, textoNoVacio } from '../validaciones'

type NotificacionTeExtranamos = Extract<NotificacionCliente, { tipo: 'cliente.te_extranamos' }>

// Carta "Te extrañamos": en la lista es un aviso más; al tocarlo, la bandeja abre la carta
// (no lleva a otra pantalla, por eso no tiene destino).
export const estrategiaTeExtranamos: EstrategiaNotificacionCliente<NotificacionTeExtranamos> = {
  tipo: 'cliente.te_extranamos',
  crear(base, datos) {
    if (!esRegistro(datos)) return null

    const usuarioId = numeroPositivo(datos.usuarioId)
    const nombre = textoNoVacio(datos.nombre)
    if (usuarioId === null || nombre === null) return null

    return {
      ...base,
      tipo: 'cliente.te_extranamos',
      datos: { usuarioId, nombre, productoFavorito: textoNoVacio(datos.productoFavorito) },
    }
  },
  describir() {
    return {
      titulo: 'Tenés un mensaje de BurgerFast',
      detalle: 'Tocá para leerlo.',
      tono: 'mensaje',
    }
  },
  obtenerDestino() {
    return null
  },
}
