import { useEffect, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getHistorialPedidos } from '../../services/orderService'
import BotonRepetirPedido from '../BotonRepetirPedido'
import { formatearFecha } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import type { Order } from '../../types/order'

// "1× Duo + 1× Papas y 2 más"
function resumirProductos(pedido: Order, maximo = 2) {
  const lineas = pedido.DetallePedidos.map((d) => `${d.cantidad}× ${d.Producto.nombre}`)
  const visibles = lineas.slice(0, maximo).join(' + ')
  const resto = lineas.length - maximo
  return resto > 0 ? `${visibles} y ${resto} más` : visibles
}

// Último pedido del cliente con el botón para repetirlo. Si no hay pedidos, no se muestra.
function UltimoPedidoCard() {
  const { user } = useAuth()
  const [pedido, setPedido] = useState<Order | null>(null)

  useEffect(() => {
    if (!user) return
    getHistorialPedidos(user.id)
      .then((pedidos) => {
        const ultimo = [...pedidos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
        setPedido(ultimo ?? null)
      })
      .catch(() => setPedido(null))
  }, [user])

  if (!pedido) return null

  return (
    <section className="relative z-10 -mt-12 px-4 pb-10">      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white p-6 shadow-sticker">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-cream">
          <ReceiptText className="h-7 w-7 text-brand-red" />
        </span>

        <div className="min-w-0 flex-1 basis-64">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Tu último pedido · {formatearFecha(pedido.fecha)}
          </p>
          <p className="font-display text-2xl font-extrabold leading-tight text-brand-dark">{resumirProductos(pedido)}</p>
        </div>

        <span className="font-display text-3xl font-extrabold text-brand-dark">{formatearPrecio(Number(pedido.total))}</span>

        <div>
          <BotonRepetirPedido pedidoId={pedido.id} variante="oscuro" />
        </div>
      </div>
    </section>
  )
}

export default UltimoPedidoCard