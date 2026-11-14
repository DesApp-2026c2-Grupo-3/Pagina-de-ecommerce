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
      ? 'bg-green-50 text-green-700'
      : pedido.estado === 'Cancelado'
        ? 'bg-red-50 text-red-700'
        : 'bg-slate-100 text-slate-600'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-900">
            Pedido #{pedido.id}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            ${Number(pedido.total).toLocaleString('es-AR')}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoColor}`}>
          {pedido.estado}
        </span>
      </div>

      {/* Cliente y dirección */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <UserRound size={16} className="text-slate-400" />
          {pedido.Usuario.nombre} {pedido.Usuario.apellido}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone size={16} className="text-slate-400" />
          {pedido.Usuario.telefono}
        </div>

        {pedido.Direccion && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />

            <span>
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
        className="mt-4 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        <span className="flex items-center gap-2">
          <Package size={16} />
          {pedido.DetallePedidos.length} productos
        </span>

        <ChevronDown
          size={16}
          className={`transition-transform ${
            productosAbiertos ? 'rotate-180' : ''
          }`}
        />
      </button>

      {productosAbiertos && (
        <div className="mt-3 space-y-3">
          {pedido.DetallePedidos.map((detalle) => (
            <div
              key={detalle.id}
              className="flex items-center gap-3"
            >
              {detalle.Producto.imagen ? (
                <img
                  src={detalle.Producto.imagen}
                  alt={detalle.Producto.nombre}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Package size={18} className="text-slate-400" />
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

              <p className="shrink-0 text-sm font-semibold text-slate-700">
                ${(Number(detalle.precio) * detalle.cantidad).toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}