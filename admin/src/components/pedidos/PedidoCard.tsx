import { ChevronRight, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PedidoFila } from '../../types/pedido.types'
import { formatearFechaHora, normalizarEstado } from '../../utils/pedidoEstado'
import type { EstadoNavegacionPedido } from '../../utils/navegacion/rutasPedido'
import {
  formatearPrecio,
  nombreCliente,
  resumenProductos,
  siguienteEtapaRapida,
} from '../../utils/pedidos/resumenPedido'
import EtapaBadge from './EtapaBadge'

interface PedidoCardProps {
  pedido: PedidoFila
  // Recién salido de la cola: recuadro ámbar + «Nuevo»
  resaltado: boolean
  // Primer clic dado: el botón pide confirmación
  armado: boolean
  guardando: boolean
  error: string | undefined
  enlaceDetalle: string
  estadoNavegacion: EstadoNavegacionPedido
  onAccionRapida: () => void
}

// Por qué no hay acción rápida (sin color de urgencia: solo texto, D6)
function notaSinAccion(pedido: PedidoFila): string {
  switch (normalizarEstado(pedido.estado)) {
    case 'Listo para retirar':
      if (pedido.retiradoEn) return 'Retirado · no se cancela'
      return pedido.viajeId ? 'En un viaje · sin retirar' : 'Esperando repartidor'
    case 'En camino':
      return 'Lo gestiona el repartidor'
    default:
      return 'Solo lectura'
  }
}

// Tarjeta horizontal y compacta (plan responsivo, 4.1). Con container queries:
// móvil = 4 líneas · tablet (@xl) = 2 líneas · escritorio (@5xl) = 1 fila.
export default function PedidoCard({
  pedido,
  resaltado,
  armado,
  guardando,
  error,
  enlaceDetalle,
  estadoNavegacion,
  onAccionRapida,
}: PedidoCardProps) {
  const siguiente = siguienteEtapaRapida(pedido.estado)
  const productos = resumenProductos(pedido)
  const hora = formatearFechaHora(pedido.fecha)

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg border-2 bg-white px-3 py-3 @xl:grid-cols-[9rem_minmax(0,1fr)_6rem_10.5rem] @xl:px-4 @5xl:grid-cols-[9rem_minmax(0,1fr)_6rem_10.5rem_17rem] @5xl:gap-x-4 @5xl:py-2.5 ${
        resaltado
          ? 'border-amber-400 ring-2 ring-amber-200 motion-safe:animate-ingreso-pedido'
          : 'border-gray-200'
      }`}
    >
      <p className="col-start-1 row-start-1 text-sm @xl:flex @xl:flex-col @5xl:row-start-1 @5xl:row-end-3">
        <span className="font-extrabold text-gray-900">#{pedido.id}</span>
        <span className="whitespace-nowrap text-gray-600"><span className="@xl:hidden"> · </span>{hora}</span>
      </p>

      <div className="col-start-2 row-start-1 justify-self-end @xl:col-start-4 @5xl:row-start-1 @5xl:row-end-3 @5xl:justify-self-start">
        <EtapaBadge estado={pedido.estado} />
      </div>

      <p className="col-start-1 row-start-2 flex min-w-0 items-center gap-2 @xl:col-start-2 @xl:row-start-1 @5xl:self-end">
        <span className="truncate font-bold text-gray-800">{nombreCliente(pedido)}</span>
        {resaltado && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
            Nuevo
          </span>
        )}
      </p>

      <p className="col-start-2 row-start-2 justify-self-end whitespace-nowrap font-extrabold text-gray-900 @xl:col-start-3 @xl:row-start-1 @5xl:row-start-1 @5xl:row-end-3">
        {formatearPrecio(pedido.total)}
      </p>

      <p
        title={productos}
        className="col-start-1 col-end-3 row-start-3 min-w-0 text-sm text-gray-600 @xl:col-end-3 @xl:row-start-2 @xl:truncate @5xl:col-start-2 @5xl:col-end-3 @5xl:self-start"
      >
        {productos}
      </p>

      <div className="col-start-1 col-end-3 row-start-4 mt-1 flex items-center gap-2 @xl:col-start-3 @xl:col-end-5 @xl:row-start-2 @xl:mt-0 @xl:justify-end @5xl:col-start-5 @5xl:col-end-6 @5xl:row-start-1 @5xl:row-end-3">
        {siguiente ? (
          <button
            type="button"
            onClick={onAccionRapida}
            disabled={guardando}
            aria-label={
              armado
                ? `Confirmar: pasar el pedido ${pedido.id} a ${siguiente}`
                : `Pasar el pedido ${pedido.id} a ${siguiente}`
            }
            className={`min-h-11 flex-1 whitespace-nowrap rounded-lg border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 @xl:min-h-9 @xl:flex-none ${
              armado
                ? 'border-action bg-action text-white hover:bg-action-hover'
                : 'border-orange-600 bg-white text-orange-700 hover:bg-orange-50'
            }`}
          >
            {guardando ? 'Guardando...' : armado ? '¿Confirmar?' : `→ ${siguiente}`}
          </button>
        ) : (
          <span className="inline-flex flex-1 items-center gap-1.5 whitespace-nowrap text-sm text-gray-600 @xl:flex-none">
            <Lock size={14} aria-hidden="true" /> {notaSinAccion(pedido)}
          </span>
        )}
        <Link
          to={enlaceDetalle}
          state={estadoNavegacion}
          aria-label={`Ver detalle del pedido ${pedido.id}`}
          className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 @xl:min-h-9"
        >
          Ver detalle <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {error && (
        <p role="alert" className="col-span-full rounded border border-red-300 bg-red-50 px-2 py-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </li>
  )
}
