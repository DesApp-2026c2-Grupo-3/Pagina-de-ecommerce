import { Link } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import PageHeader from '../ui/PageHeader'
import PasosCompra from '../cart/PasosCompra'
import { formatearPrecio } from '../../utils/precio'
import type { Order } from '../../types/order'

interface Props {
  pedido: Order
  /** Productos que siguen en el carrito (solo en una compra directa) */
  quedanEnCarrito: number
}

// Pantalla final del checkout
function PedidoConfirmado({ pedido, quedanEnCarrito }: Props) {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <PageHeader titulo="¡Listo!">
        <PasosCompra actual={2} />
      </PageHeader>

      <div className="mx-auto -mt-12 max-w-md px-4 pb-16">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-8 text-center shadow-sticker">
          <span className="grid h-20 w-20 -rotate-6 place-items-center rounded-3xl bg-brand-mustard">
            <PartyPopper className="h-10 w-10" />
          </span>
          <h2 className="font-display text-3xl font-extrabold">¡Pedido confirmado!</h2>
          <p className="text-brand-muted">
            Tu pedido <span className="font-bold text-brand-red">#{pedido.id}</span> ya está en la cocina.
          </p>
          <p className="font-display text-3xl font-extrabold">{formatearPrecio(Number(pedido.total))}</p>
          <Link
            to="/historial"
            className="mt-2 inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Seguir mi pedido
          </Link>
          {quedanEnCarrito > 0 && (
            <Link to="/carrito" className="text-sm font-bold underline hover:text-brand-red">
              Tu carrito sigue guardado ({quedanEnCarrito} {quedanEnCarrito === 1 ? 'producto' : 'productos'})
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default PedidoConfirmado