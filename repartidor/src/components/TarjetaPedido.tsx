
import type { Pedido } from '../types/pedido'

interface TarjetaPedidoProps {
  pedido: Pedido
  seleccionado: boolean
  onSeleccionar: (id: number) => void
}

function TarjetaPedido({
  pedido,
  seleccionado,
  onSeleccionar,
}: TarjetaPedidoProps) {
  return (
    <article
      className={`tarjeta-pedido ${seleccionado ? 'seleccionado' : ''}`}
    >
      <label className="seleccion-pedido">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => onSeleccionar(pedido.id)}
        />

        <div className="datos-pedido">
          <div className="numero-pedido">
            <strong>Pedido #{pedido.id}</strong>
            <span className="estado pendiente">Pendiente</span>
          </div>

          <p className="direccion">
            <span aria-hidden="true">📍</span> {pedido.direccion}
          </p>

          <p className="productos">
            {pedido.cantidadProductos}{' '}
            {pedido.cantidadProductos === 1 ? 'producto' : 'productos'}
          </p>
        </div>
      </label>
    </article>
  )
}

export default TarjetaPedido
