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
    <article className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Viaje #{viaje.id}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays size={14} />
              {formatearFecha(viaje.fechaInicio)}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              finalizado
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {finalizado ? 'Finalizado' : 'Cancelado'}
          </span>
        </div>

        {/* Estadísticas */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <Package size={19} className="text-slate-500" />
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalPedidos}
            </p>
            <p className="text-xs text-slate-500">Pedidos</p>
          </div>

          <div className="rounded-xl bg-green-50 p-3">
            <CheckCircle size={19} className="text-green-600" />
            <p className="mt-2 text-2xl font-bold text-green-700">
              {entregados}
            </p>
            <p className="text-xs text-green-700">Entregados</p>
          </div>

          <div className="rounded-xl bg-red-50 p-3">
            <XCircle size={19} className="text-red-500" />
            <p className="mt-2 text-2xl font-bold text-red-600">
              {cancelados}
            </p>
            <p className="text-xs text-red-600">Cancelados</p>
          </div>
        </div>

        {/* Porcentaje de entregas */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Entregas exitosas
            </p>

            <p className="text-sm font-bold text-slate-900">
              {porcentaje}%
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        {/* Información temporal */}
        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Clock size={17} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Inicio</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatearFecha(viaje.fechaInicio)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle size={17} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Finalización</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatearFecha(viaje.fechaFin)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Truck size={17} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Duración</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatearDuracion(viaje.fechaInicio, viaje.fechaFin)}
              </p>
            </div>
          </div>
        </div>

        {/* Ver pedidos */}
        <button
          type="button"
          onClick={() => setPedidosAbiertos(!pedidosAbiertos)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          <Package size={17} />

          {pedidosAbiertos ? 'Ocultar pedidos' : 'Ver pedidos del viaje'}

          <ChevronDown
            size={17}
            className={`transition-transform ${
              pedidosAbiertos ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Pedidos */}
      {pedidosAbiertos && (
        <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-5">
          <h4 className="font-bold text-slate-800">
            Pedidos del viaje
          </h4>

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