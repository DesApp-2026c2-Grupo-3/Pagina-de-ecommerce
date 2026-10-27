
import { useState } from 'react'
import Encabezado from '../components/Encabezado'
import ListaPedidos from '../components/ListaPedidos'
import { pedidosMock } from '../data/pedidosMock'
import type { Pedido } from '../types/pedido'
//import './MisPedidos.css'
import PedidoEnViaje from '../components/PedidoEnViaje'

function MisPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosMock)
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<number[]>([])

  function seleccionarPedido(id: number) {
    setPedidosSeleccionados((seleccionados) =>
      seleccionados.includes(id)
        ? seleccionados.filter((pedidoId) => pedidoId !== id)
        : [...seleccionados, id],
    )
  }

  function iniciarViaje() {
    setPedidos((pedidosActuales) =>
      pedidosActuales.map((pedido) =>
        pedidosSeleccionados.includes(pedido.id)
          ? { ...pedido, estado: 'en-viaje' }
          : pedido,
      ),
    )

    setPedidosSeleccionados([])
  }

  function marcarComoEntregado(id: number) {
    setPedidos((pedidosActuales) =>
      pedidosActuales.map((pedido) =>
        pedido.id === id
          ? { ...pedido, estado: 'entregado' }
          : pedido,
      ),
    )
  }

  const pedidosPendientes = pedidos.filter(
    (pedido) => pedido.estado === 'pendiente',
  )

  const pedidosEnViaje = pedidos.filter(
    (pedido) => pedido.estado === 'en-viaje',
  )

  return (
    <main className="app">
      <Encabezado />

      <section className="resumen">
        <article className="tarjeta-resumen">
          <span>Pedidos pendientes</span>
          <strong>{pedidosPendientes.length}</strong>
        </article>

        <article className="tarjeta-resumen">
          <span>Pedidos en viaje</span>
          <strong>{pedidosEnViaje.length}</strong>
        </article>
      </section>

      <section className="seccion-pedidos">
        <div className="titulo-seccion">
          <div>
            <h2>Pedidos disponibles</h2>
            <p>Seleccioná los pedidos que vas a llevar en tu próximo viaje.</p>
          </div>

          <span className="contador">
            {pedidosPendientes.length} pendientes
          </span>
        </div>

        <ListaPedidos
          pedidos={pedidosPendientes}
          pedidosSeleccionados={pedidosSeleccionados}
          onSeleccionar={seleccionarPedido}
        />

        <p className="seleccion-info">
          Seleccionados: {pedidosSeleccionados.length}
        </p>

        <button
          className="boton-principal"
          type="button"
          disabled={pedidosSeleccionados.length === 0}
          onClick={iniciarViaje}
        >
          Iniciar viaje
          {pedidosSeleccionados.length > 0 &&
            ` (${pedidosSeleccionados.length})`}
        </button>
      </section>

      
<section className="seccion-pedidos">
  <div className="titulo-seccion">
    <div>
      <h2>Viaje en curso</h2>
      <p>Marcá cada pedido cuando lo hayas entregado.</p>
    </div>
  </div>

  {pedidosEnViaje.length === 0 ? (
    <p className="vacio">Todavía no tenés pedidos en viaje.</p>
  ) : (
    <div className="lista-pedidos">
      {pedidosEnViaje.map((pedido) => (
        <PedidoEnViaje
          key={pedido.id}
          pedido={pedido}
          onMarcarEntregado={marcarComoEntregado}
        />
      ))}
    </div>
  )}
</section>

    </main>
  )
}

export default MisPedidos
