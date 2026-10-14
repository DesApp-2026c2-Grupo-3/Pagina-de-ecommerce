import { Check, X } from 'lucide-react'
import type { RegistroTiempoPedido } from '../types/pedido'
import {
  PASOS_SEGUIMIENTO,
  fechaCancelacion,
  fechasPorPaso,
  formatearFechaHora,
  normalizarEstado,
  pasoActual,
} from '../utils/pedidoEstado'

interface Props {
  estado: string
  historial: RegistroTiempoPedido[]
}

// Línea de tiempo del pedido con la estética del panel de administración.
// Solo muestra el avance hasta la posición actual del estado: si el pedido
// retrocedió (ej. de "En camino" a "En proceso"), los pasos posteriores no
// se renderizan para evitar confusiones.
export default function SeguimientoPedidoAdmin({ estado, historial }: Props) {
  const actual = pasoActual(estado)

  // Cancelado está fuera del flujo de 4 pasos: banner dedicado con su fecha
  if (normalizarEstado(estado) === 'Cancelado') {
    const fecha = fechaCancelacion(historial)
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
          <X size={14} />
        </span>
        <p>
          <span className="font-semibold">Pedido cancelado</span>
          {fecha && <span className="text-red-700/80"> · {formatearFechaHora(fecha)}</span>}
        </p>
      </div>
    )
  }

  const fechas = fechasPorPaso(historial)
  const pasosVisibles = PASOS_SEGUIMIENTO.slice(0, actual + 1)

  return (
    <ol aria-label="Seguimiento del pedido" className="flex flex-col gap-1">
      {pasosVisibles.map((paso, i) => {
        const esActual = i === actual
        const fecha = fechas.get(paso) ?? null
        return (
          <li
            key={paso}
            aria-current={esActual ? 'step' : undefined}
            className="flex items-start gap-3"
          >
            <span className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  esActual ? 'bg-action text-white' : 'bg-success text-white'
                }`}
              >
                {esActual ? i + 1 : <Check size={14} />}
              </span>
              {i < pasosVisibles.length - 1 && (
                <span aria-hidden="true" className="w-0.5 flex-1 bg-success/40 py-0.5" />
              )}
            </span>
            <span className="pb-3">
              <span className="block text-sm font-semibold text-gray-800">{paso}</span>
              <span className="block text-xs text-gray-500">
                {fecha ? formatearFechaHora(fecha) : '—'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
