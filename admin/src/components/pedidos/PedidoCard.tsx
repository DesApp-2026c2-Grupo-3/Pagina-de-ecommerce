import { Eye, Lock } from 'lucide-react'
import type { Etapa, PedidoFila } from '../../types/pedido.types'
import { ETAPAS } from '../../types/pedido.types'
import {
  admiteCambiosDelAdmin,
  COLORES_ETAPA,
  esEstadoFinal,
  formatearFechaHora,
} from '../../utils/pedidoEstado'
import SelectorEtapa from './SelectorEtapa'

const botonAceptar =
  'rounded border border-orange-300 bg-action px-4 py-2 font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-40'

function esEtapa(valor: string): valor is Etapa {
  return (ETAPAS as readonly string[]).includes(valor)
}

function EtapaBadge({ estado }: { estado: string }) {
  const color = esEtapa(estado)
    ? COLORES_ETAPA[estado]
    : 'bg-gray-200 text-gray-600'
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${color}`}
    >
      {estado}
    </span>
  )
}

function resumenProductos(pedido: PedidoFila) {
  const detalles = pedido.DetallePedidos ?? []
  const primeros = detalles
    .slice(0, 3)
    .map((d) => `${d.cantidad}× ${d.Producto?.nombre ?? 'producto'}`)
  const resto = detalles.length - Math.min(detalles.length, 3)
  if (resto > 0) primeros.push(`+${resto} más`)
  return primeros.join(' · ') || 'Sin productos'
}

interface PedidoCardProps {
  pedido: PedidoFila
  etapaSeleccionada: Etapa | undefined
  guardando: boolean
  error: string | undefined
  puedeAceptar: boolean
  resaltado: boolean
  onSeleccionarEtapa: (etapa: Etapa) => void
  onAceptar: () => void
  onVerDetalle: () => void
}

export default function PedidoCard({
  pedido,
  etapaSeleccionada,
  guardando,
  error,
  puedeAceptar,
  resaltado,
  onSeleccionarEtapa,
  onAceptar,
  onVerDetalle,
}: PedidoCardProps) {
  const cerrado = esEstadoFinal(pedido.estado)
  // En camino: no es final, pero lo gestiona el repartidor (el panel no lo cambia)
  const editable = admiteCambiosDelAdmin(pedido.estado)
  const cliente = pedido.Usuario
    ? [pedido.Usuario.nombre, pedido.Usuario.apellido]
        .filter((parte) => parte?.trim())
        .join(' ')
    : 'Cliente no disponible'

  return (
    <li
      className={`flex w-full flex-col overflow-hidden rounded-lg border bg-white p-4 transition-colors ${
        resaltado ? 'border-amber-400 ring-2 ring-amber-200' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
        <div className="min-w-0">
          <p className="font-semibold">Pedido #{pedido.id}</p>
          <p className="text-xs text-gray-500">
            {formatearFechaHora(pedido.fecha)}
          </p>
        </div>
        <EtapaBadge estado={pedido.estado} />
      </div>

      <div className="flex flex-col gap-1 border-b py-3 text-sm text-gray-600">
        <p className="font-medium text-gray-800">{cliente}</p>
        <p>{resumenProductos(pedido)}</p>
        <p>
          Total:{' '}
          <span className="font-semibold text-gray-800">
            ${Number(pedido.total).toLocaleString('es-AR')}
          </span>
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-3">
        <SelectorEtapa
          pedidoId={pedido.id}
          valor={etapaSeleccionada ?? pedido.estado}
          estadoActual={pedido.estado}
          bloqueado={cerrado || guardando}
          onChange={onSeleccionarEtapa}
        />
        {error && (
          <p
            role="alert"
            className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <button
              type="button"
              onClick={onAceptar}
              disabled={!puedeAceptar}
              className={botonAceptar}
            >
              {guardando ? 'Guardando...' : 'Aceptar'}
            </button>
          )}
          <button
            type="button"
            onClick={onVerDetalle}
            className="inline-flex items-center gap-1 rounded border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eye size={16} /> Ver detalle
          </button>
          {cerrado && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <Lock size={14} /> {pedido.estado} · solo lectura
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
