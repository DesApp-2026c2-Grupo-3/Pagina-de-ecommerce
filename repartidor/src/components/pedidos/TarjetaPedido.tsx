import { MapPin, Clock, UserRound, Package } from 'lucide-react'
import type { Pedido } from '../../types/pedido.types'

interface TarjetaPedidoProps {
  pedido: Pedido
  seleccionado: boolean
  onSeleccionar: (id: number) => void
}

export default function TarjetaPedido({ pedido, seleccionado, onSeleccionar }: TarjetaPedidoProps) {
  const fecha = new Date(pedido.fecha)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Pedido #{pedido.id}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            ${Number(pedido.total).toLocaleString('es-AR')}
          </h3>
        </div>

        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
          Pendiente
        </span>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <UserRound size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            {pedido.Usuario.nombre} {pedido.Usuario.apellido}
          </span>
        </div>

        <div className="flex items-start gap-3 text-sm text-slate-600">
          <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            {pedido.Direccion
              ? `${pedido.Direccion.calle} ${pedido.Direccion.numero}, ${pedido.Direccion.localidad}`
              : 'Dirección no disponible'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Clock size={18} className="shrink-0 text-slate-400" />
          <span>
            {fecha.toLocaleDateString('es-AR')} · {fecha.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Package size={18} className="shrink-0 text-slate-400" />
          <span>
            {pedido.DetallePedidos.length} productos diferentes
          </span>
        </div>

        <button type="button"
          onClick={() => onSeleccionar(pedido.id)}
          className={`w-full rounded-xl px-4 py-2 font-semibold transition ${
            seleccionado
          ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}>
            {seleccionado ? 'Quitar selección' : 'Seleccionar pedido'}
        </button>
      </div>
    </article>
  )
}