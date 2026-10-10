import type { Order } from '../../types/order'
import { normalizarEstado } from '../../config/pedidoEstados'
import { formatearFechaHora } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import { resumenItems } from '../../utils/pedidos'
import SeguimientoPedido from './SeguimientoPedido'

// Tarjeta oscura destacada para un pedido que todavía no se entregó
function PedidoEnCurso({ pedido }: { pedido: Order }) {
  return (
    <article className="flex flex-col gap-5 rounded-[1.75rem] bg-brand-dark p-6 text-brand-cream shadow-[8px_8px_0_var(--color-brand-red)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-brand-mustard">
            {normalizarEstado(pedido.estado)} · Pedido #{pedido.id}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold leading-tight tracking-tight">{resumenItems(pedido)}</p>
          <p className="mt-1 text-sm text-brand-cream/70">{formatearFechaHora(pedido.fecha)}</p>
        </div>
        <p className="font-display text-3xl font-extrabold">{formatearPrecio(Number(pedido.total))}</p>
      </div>

      <SeguimientoPedido estado={pedido.estado} />
    </article>
  )
}

export default PedidoEnCurso