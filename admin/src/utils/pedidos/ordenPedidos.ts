import type { PedidoFila } from '../../types/pedido.types'

export function ordenarPedidosPorFechaDesc(pedidos: PedidoFila[]): PedidoFila[] {
  return [...pedidos].sort((a, b) => {
    const diferencia = Date.parse(b.fecha) - Date.parse(a.fecha)
    if (diferencia !== 0) return diferencia
    return b.id - a.id
  })
}
