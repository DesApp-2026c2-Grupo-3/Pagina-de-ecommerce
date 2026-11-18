
import { useState } from 'react'
import {
  Package,
  ChevronDown,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'

import type { Pedido } from '../../types/pedido.types'

interface Props {
  pedido: Pedido
}

export default function TarjetaPedidoHistorial({ pedido }: Props) {
  const [productosAbiertos, setProductosAbiertos] = useState(false)

  const estadoColor =
    pedido.estado === 'Entregado'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : pedido.estado === 'Cancelado'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-orange-200 bg-orange-50 text-orange-700'

  return (
    <article className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md sm:p-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pedido #{pedido.id}
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-800">
            ${Number(pedido.total).toLocaleString('es-AR')}
          </p>
        </div>

        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${estadoColor}`}>
          {pedido.estado}
        </span>
      </div>

      {/* Separador */}
      <div className="my-4 border-t border-orange-100" />

      {/* Cliente y dirección */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
            <UserRound size={16} className="text-orange-600" />
          </div>

          <div className="min-w-0 pt-1">
            <p className="font-semibold text-slate-800">
              {pedido.Usuario.nombre} {pedido.Usuario.apellido}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-slate-600">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
            <Phone size={16} className="text-orange-600" />
          </div>

          <p className="min-w-0 pt-1">
            {pedido.Usuario.telefono}
          </p>
        </div>

        {pedido.Direccion && (
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <MapPin size={16} className="text-orange-600" />
            </div>

            <span className="min-w-0 pt-1">
              {pedido.Direccion.calle} {pedido.Direccion.numero}

              {pedido.Direccion.piso
                ? `, piso ${pedido.Direccion.piso}`
                : ''}

              {' - '}
              {pedido.Direccion.localidad}, {pedido.Direccion.provincia}
            </span>
          </div>
        )}
      </div>

      {/* Productos */}
      <button
        type="button"
        onClick={() => setProductosAbiertos(!productosAbiertos)}
        className={`mt-5 flex w-full items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold transition ${
          productosAbiertos
            ? 'border-orange-200 bg-orange-100/70 text-orange-700'
            : 'border-orange-100 bg-orange-50/50 text-slate-600 hover:border-orange-200 hover:bg-orange-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <Package size={17} className="text-orange-600" />
          {pedido.DetallePedidos.length} productos
        </span>

        <ChevronDown
          size={17}
          className={`text-orange-600 transition-transform duration-200 ${
            productosAbiertos ? 'rotate-180' : ''
          }`}
        />
      </button>

      {productosAbiertos && (
        <div className="mt-3 space-y-3 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
          {pedido.DetallePedidos.map((detalle) => (
            <div
              key={detalle.id}
              className="flex items-center gap-3"
            >
              {detalle.Producto.imagen ? (
                <img
                  src={detalle.Producto.imagen}
                  alt={detalle.Producto.nombre}
                  className="h-11 w-11 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                  <Package size={18} className="text-orange-400" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {detalle.Producto.nombre}
                </p>

                <p className="text-xs text-slate-500">
                  Cantidad: {detalle.cantidad}
                </p>
              </div>

              <p className="shrink-0 text-sm font-bold text-slate-700">
                ${(Number(detalle.precio) * detalle.cantidad).toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
