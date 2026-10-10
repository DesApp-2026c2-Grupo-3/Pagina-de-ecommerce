import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Order } from '../../types/order'
import { ESTILO_ESTADO, normalizarEstado } from '../../config/pedidoEstados'
import { formatearFechaHora } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import { diaYMes, resumenItems } from '../../utils/pedidos'
import BotonRepetirPedido from '../BotonRepetirPedido'

// Un pedido del historial: fecha al costado, resumen, total y acciones. "Detalle" despliega los productos.
function PedidoCard({ pedido }: { pedido: Order }) {
  const [abierto, setAbierto] = useState(false)
  const estado = normalizarEstado(pedido.estado)
  const { dia, mes } = diaYMes(pedido.fecha)

  return (
    <article className="rounded-3xl border-2 border-brand-dark bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-16 shrink-0 border-r-2 border-dashed border-brand-sand pr-4 text-center">
          <p className="font-display text-3xl font-extrabold leading-none">{dia}</p>
          <p className="text-xs font-bold uppercase text-brand-muted">{mes}</p>
        </div>

        <div className="min-w-0 flex-1 basis-48">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-extrabold">Pedido #{pedido.id}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${ESTILO_ESTADO[estado]}`}>{estado}</span>
          </div>
          <p className="truncate text-brand-dark/80">{resumenItems(pedido)}</p>
          <p className="text-xs text-brand-muted">{formatearFechaHora(pedido.fecha)}</p>
        </div>

        <p className="font-display text-2xl font-extrabold">{formatearPrecio(Number(pedido.total))}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-brand-sand pt-4">
        <BotonRepetirPedido pedidoId={pedido.id} />
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-brand-dark bg-white px-4 text-sm font-bold transition-colors hover:bg-brand-cream"
        >
          Detalle
          <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {abierto && (
        <ul className="mt-4 flex flex-col gap-2 rounded-2xl bg-brand-cream p-4">
          {pedido.DetallePedidos.map((detalle) => (
            <li key={detalle.id} className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-bold">{detalle.cantidad}×</span> {detalle.Producto.nombre}
              </span>
              <span className="font-bold text-brand-muted">
                {formatearPrecio(Number(detalle.precio) * detalle.cantidad)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default PedidoCard