import { MapPin, UserRound, Package, Clock } from 'lucide-react'
import type { Pedido } from '../../types/pedido.types'

interface TarjetaPedidoViajeProps {
  pedido: Pedido
  onActualizarEstado: (
    pedidoId: number,
    estado: 'En camino' | 'Entregado'
  ) => void
  procesando: boolean
}

export default function TarjetaPedidoViaje({
  pedido,
  onActualizarEstado,
  procesando,
}: TarjetaPedidoViajeProps) {
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
          {pedido.estado}
        </span>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <UserRound size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            {pedido.Usuario.nombre} {pedido.Usuario.apellido ?? ''}
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
            {fecha.toLocaleDateString('es-AR')} ·{' '}
            {fecha.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h4 className="mb-3 text-sm font-bold text-slate-800">
          Productos del pedido
        </h4>

        <div className="space-y-3">
          {pedido.DetallePedidos.map((detalle) => (
            <div key={detalle.id} className="flex items-center gap-3">
              {detalle.Producto.imagen ? (
                <img
                  src={detalle.Producto.imagen}
                  alt={detalle.Producto.nombre}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Package className="text-slate-400" size={20} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {detalle.Producto.nombre}
                </p>
                <p className="text-xs text-slate-500">
                  Cantidad: {detalle.cantidad}
                </p>
              </div>

              <span className="text-sm font-semibold text-slate-700">
                ${Number(detalle.precio).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {pedido.observaciones && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">
            Observaciones del pedido
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {pedido.observaciones}
          </p>
        </div>
      )}

      {/* Acciones del repartidor */}
      {pedido.estado === 'Listo para retirar' && (
        <button
          onClick={() => onActualizarEstado(pedido.id, 'En camino')}
          disabled={procesando}
          className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? 'Procesando...' : 'Retirar pedido'}
        </button>
      )}

      {pedido.estado === 'En camino' && (
        <button
          onClick={() => onActualizarEstado(pedido.id, 'Entregado')}
          disabled={procesando}
          className="mt-5 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? 'Procesando...' : 'Confirmar entrega'}
        </button>
      )}
    </article>
  )
}