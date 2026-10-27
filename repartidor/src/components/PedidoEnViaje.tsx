
import type { Pedido } from '../types/pedido'

interface PedidoEnViajeProps {
  pedido: Pedido
  onMarcarEntregado: (id: number) => void
}

function PedidoEnViaje({
  pedido,
  onMarcarEntregado,
}: PedidoEnViajeProps) {
  return (
    <article className="tarjeta-pedido">
      <div className="datos-pedido">
        <div className="numero-pedido">
          <strong>Pedido #{pedido.id}</strong>
          <span className="estado en-reparto">En viaje</span>
        </div>

        <p className="direccion">{pedido.direccion}</p>

        <p className="productos">
          {pedido.cantidadProductos}{' '}
          {pedido.cantidadProductos === 1 ? 'producto' : 'productos'}
        </p>

        <button
          className="boton-entregado"
          type="button"
          onClick={() => onMarcarEntregado(pedido.id)}
        >
          Marcar como entregado
        </button>
      </div>
    </article>
  )
}

export default PedidoEnViaje
