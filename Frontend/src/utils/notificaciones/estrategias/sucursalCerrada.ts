import type {
  EstrategiaNotificacionCliente,
  NotificacionCliente,
} from '../../../types/notificacion.types'
import { esRegistro, numeroPositivo, textoNoVacio } from '../validaciones'

type NotificacionSucursalCerrada = Extract<NotificacionCliente, { tipo: 'sucursal.cerrada' }>

export const estrategiaSucursalCerrada: EstrategiaNotificacionCliente<NotificacionSucursalCerrada> = {
  tipo: 'sucursal.cerrada',
  crear(base, datos) {
    if (!esRegistro(datos)) return null

    const sucursalId = numeroPositivo(datos.sucursalId)
    const sucursalNombre = textoNoVacio(datos.sucursalNombre)
    if (sucursalId === null || sucursalNombre === null) return null

    return { ...base, tipo: 'sucursal.cerrada', datos: { sucursalId, sucursalNombre } }
  },
  describir(notificacion) {
    return {
      titulo: `${notificacion.datos.sucursalNombre} cerró`,
      detalle: 'No se pueden generar pedidos por ahora.',
      tono: 'sucursal',
    }
  },
  obtenerDestino() {
    return null
  },
}
