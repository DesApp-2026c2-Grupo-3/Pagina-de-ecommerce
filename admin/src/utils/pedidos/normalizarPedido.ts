import type { PedidoFila } from '../../types/pedido.types'
import { ETAPAS } from '../../types/pedido.types'

// Pedidos creados antes de la validación traen estados como "pendiente" (minúscula):
// se llevan a la forma canónica para que el badge, el filtro y el selector coincidan
export function normalizarEtapa(valor: string): string {
  const coincidencia = ETAPAS.find(
    (etapa) => etapa.toLowerCase() === (valor ?? '').toLowerCase(),
  )
  return coincidencia ?? valor
}

export function normalizarPedidos(pedidos: PedidoFila[]): PedidoFila[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    estado: normalizarEtapa(pedido.estado),
  }))
}
