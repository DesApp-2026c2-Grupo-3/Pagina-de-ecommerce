
import type { Pedido } from '../types/pedido'
import TarjetaPedido from './TarjetaPedido'

interface ListaPedidosProps {
  pedidos: Pedido[]
  pedidosSeleccionados: number[]
  onSeleccionar: (id: number) => void
}

function ListaPedidos({
  pedidos,
  pedidosSeleccionados,
  onSeleccionar,
}: ListaPedidosProps) {
  if (pedidos.length === 0) {
    return (
      <p className="vacio">
        No hay pedidos pendientes por el momento.
      </p>
    )
  }

  return (
    <div className="lista-pedidos">
      {pedidos.map((pedido) => (
        <TarjetaPedido
          key={pedido.id}
          pedido={pedido}
          seleccionado={pedidosSeleccionados.includes(pedido.id)}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </div>
  )
}

export default ListaPedidos
