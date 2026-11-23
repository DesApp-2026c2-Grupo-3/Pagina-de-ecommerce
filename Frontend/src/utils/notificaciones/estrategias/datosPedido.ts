import type { DatosPedido } from '../../../types/notificacion.types'
import {
  esRegistro,
  fechaIso,
  numeroNoNegativo,
  numeroPositivo,
  textoNoVacio,
} from '../validaciones'

// Valida los datos que comparten los avisos de pedido (creado y cambio de estado)
export function leerDatosPedido(datos: unknown): DatosPedido | null {
  if (!esRegistro(datos)) return null

  const pedidoId = numeroPositivo(datos.pedidoId)
  const usuarioId = numeroPositivo(datos.usuarioId)
  const sucursalId = numeroPositivo(datos.sucursalId)
  const estado = textoNoVacio(datos.estado)
  const total = numeroNoNegativo(datos.total)
  const fecha = fechaIso(datos.fecha)
  const estadoAnterior = textoNoVacio(datos.estadoAnterior)
  const motivo = textoNoVacio(datos.motivo)

  if (
    pedidoId === null ||
    usuarioId === null ||
    sucursalId === null ||
    estado === null ||
    total === null ||
    fecha === null
  ) {
    return null
  }

  return { pedidoId, usuarioId, sucursalId, estadoAnterior, estado, total, fecha, motivo }
}

export const destinoPedido = (pedidoId: number) => `/pedidos/${pedidoId}`
