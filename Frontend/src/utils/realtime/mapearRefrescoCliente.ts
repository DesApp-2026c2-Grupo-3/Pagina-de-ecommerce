import type { DominioRefrescoCliente, RefrescoCliente } from '../../types/realtime.types'
import { esRegistro, numeroPositivo, textoNoVacio } from '../notificaciones/validaciones'

const DOMINIOS: readonly DominioRefrescoCliente[] = ['pedido', 'sucursal']

// Payload de `cliente:refresco` → refresco del cliente, o null si no es válido
export function mapearRefrescoCliente(payload: unknown): RefrescoCliente | null {
  if (!esRegistro(payload) || payload.version !== 1) return null

  const eventoId = textoNoVacio(payload.eventoId)
  const accion = textoNoVacio(payload.accion)
  const dominio = DOMINIOS.find((candidato) => candidato === payload.dominio)
  if (!eventoId || !accion || !dominio) return null

  const recursos = esRegistro(payload.recursos) ? payload.recursos : {}
  const sucursalId = numeroPositivo(payload.sucursalId)
  const pedidoId = numeroPositivo(recursos.pedidoId)

  if (dominio === 'pedido' && pedidoId === null) return null
  if (dominio === 'sucursal' && sucursalId === null) return null

  return { eventoId, dominio, accion, sucursalId, pedidoId }
}
