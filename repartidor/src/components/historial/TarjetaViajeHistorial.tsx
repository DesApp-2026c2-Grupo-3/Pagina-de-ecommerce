
import { useState } from 'react'
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  ChevronDown,
  Truck,
} from 'lucide-react'

import type { ViajeHistorial } from '../../types/viaje.types'
import TarjetaPedidoHistorial from './TarjetaPedidoHistorial'
import {
  formatearFecha,
  formatearDuracion,
} from '../../utils/historial.utils'

interface Props {
  viaje: ViajeHistorial
}

export default function TarjetaViajeHistorial({ viaje }: Props) {
  const [pedidosAbiertos, setPedidosAbiertos] = useState(false)

  const entregados = viaje.Pedidos.filter(
    pedido => pedido.estado === 'Entregado'
  ).length

  const cancelados = viaje.Pedidos.filter(
    pedido => pedido.estado === 'Cancelado'
  ).length

  const totalPedidos = viaje.Pedidos.length

  const porcentaje = totalPedidos > 0
    ? Math.round((entregados / totalPedidos) * 100)
    : 0

  const finalizado = viaje.estado === 'finalizado'

  return (
    <article className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md">
      <div className="p-5 sm:p-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
              Historial de viaje
            </p>

            <h3 className="mt-1 text-xl font-extrabold text-slate-800">
              Viaje #{viaje.id}
            </h3>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays size={14} className="text-orange-500" />
              {formatearFecha(viaje.fechaInicio)}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
              finalizado
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {finalizado
              ? <CheckCircle size={14} />
              : <XCircle size={14} />
            }
            {finalizado ? 'Finalizado' : 'Cancelado'}
          </span>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
            <Package size={19} className="text-orange-600" />

            <p className="mt-2 text-2xl font-extrabold text-slate-800">
              {totalPedidos}
            </p>

            <p className="text-xs font-medium text-slate-500">
              Pedidos
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
            <CheckCircle size={19} className="text-emerald-600" />

            <p className="mt-2 text-2xl font-extrabold text-emerald-700">
              {entregados}
            </p>

            <p className="text-xs font-medium text-emerald-700">
              Entregados
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/70 p-3">
            <XCircle size={19} className="text-red-500" />

            <p className="mt-2 text-2xl font-extrabold text-red-700">
              {cancelados}
            </p>

            <p className="text-xs font-medium text-red-700">
              Cancelados
            </p>
          </div>
        </div>

        {/* Porcentaje de entregas */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">
              Entregas exitosas
            </p>

            <p className="text-sm font-extrabold text-emerald-700">
              {porcentaje}%
            </p>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        {/* Información temporal */}
        <div className="mt-6 grid gap-4 border-t border-orange-100 pt-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <Clock size={17} className="text-orange-600" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Inicio
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatearFecha(viaje.fechaInicio)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <CheckCircle size={17} className="text-orange-600" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Finalización
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatearFecha(viaje.fechaFin)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <Truck size={17} className="text-orange-600" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Duración
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatearDuracion(viaje.fechaInicio, viaje.fechaFin)}
              </p>
            </div>
          </div>
        </div>

        {/* Ver pedidos */}
        <button
          type="button"
          onClick={() => setPedidosAbiertos(!pedidosAbiertos)}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200 ${
            pedidosAbiertos
              ? 'border-orange-200 bg-orange-100 text-orange-700'
              : 'border-orange-100 bg-orange-50/60 text-orange-700 hover:border-orange-300 hover:bg-orange-100'
          }`}
        >
          <Package size={17} />

          {pedidosAbiertos ? 'Ocultar pedidos' : 'Ver pedidos del viaje'}

          <ChevronDown
            size={17}
            className={`transition-transform duration-200 ${
              pedidosAbiertos ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Pedidos */}
      {pedidosAbiertos && (
        <div className="space-y-4 border-t border-orange-100 bg-orange-50/40 p-5 sm:p-6">
          <div>
            <h4 className="font-bold text-slate-800">
              Pedidos del viaje
            </h4>

            <p className="mt-1 text-xs text-slate-500">
              Detalle de los {totalPedidos} pedidos asociados
            </p>
          </div>

          {viaje.Pedidos.map((pedido) => (
            <TarjetaPedidoHistorial
              key={pedido.id}
              pedido={pedido}
            />
          ))}
        </div>
      )}
    </article>
  )
}
