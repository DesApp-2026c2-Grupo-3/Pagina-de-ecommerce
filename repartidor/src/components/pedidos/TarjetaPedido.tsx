import type { Pedido } from '../../types/pedido.types'
import { MapPin, Clock, UserRound, Package, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface TarjetaPedidoProps {
  pedido: Pedido
  seleccionado: boolean
  onSeleccionar: (id: number) => void
}

export default function TarjetaPedido({ pedido, seleccionado, onSeleccionar }: TarjetaPedidoProps) {
  const fecha = new Date(pedido.fecha);

  const [mostrarProductos, setMostrarProductos] = useState(false)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Pedido #{pedido.id}</p>
          <h3 className="text-lg font-bold text-slate-900">
            ${Number(pedido.total).toLocaleString('es-AR')}
          </h3>
        </div>

        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
          Pendiente
        </span>
      </div>

      {/* Información */}
      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <UserRound size={16} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {pedido.Usuario.nombre} {pedido.Usuario.apellido}
            </span>
          </div>

          <div className="relative">
  <button
    type="button"
    onClick={() => setMostrarProductos(!mostrarProductos)}
    className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-orange-600"
  >
    <Package size={15} />
    {pedido.DetallePedidos.length} productos
    <ChevronDown
      size={14}
      className={`transition-transform ${
        mostrarProductos ? 'rotate-180' : ''
      }`}
    />
  </button>

  {mostrarProductos && (
    <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-bold text-slate-500">
        Productos del pedido
      </p>

      <div className="space-y-2">
        {pedido.DetallePedidos.map((detalle) => (
          <div key={detalle.id}
            className="flex items-start justify-between gap-3 text-sm">
            <span className="text-slate-700">
            {detalle.Producto.imagen ? (
              <img
                src={detalle.Producto.imagen}
                alt={detalle.Producto.nombre}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                <Package className="text-slate-400" size={20} />
              </div>
            )}
            </span>
            
            <span className="text-slate-700">
            {detalle.Producto.nombre}
            </span>

            <span className="shrink-0 font-semibold text-slate-600">
            x{detalle.cantidad}
            </span>
          </div>
          ))}
      </div>
    </div>
    )}
    </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">
            {pedido.Direccion
              ? `${pedido.Direccion.calle} ${pedido.Direccion.numero}, ${pedido.Direccion.localidad}`
              : 'Dirección no disponible'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={15} className="shrink-0 text-slate-400" />
          <span>
            {fecha.toLocaleDateString('es-AR')} ·{' '}
            {fecha.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Selección */}
      <button
        type="button"
        onClick={() => onSeleccionar(pedido.id)}
        className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
          seleccionado
            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {seleccionado ? 'Quitar selección' : 'Seleccionar pedido'}
      </button>
    </article>
  )
}
