import type { Movimiento } from '../../types/stock.types'
import {
  datosTipoMovimiento,
  descripcionMovimiento,
  formatearFechaMovimiento,
  responsableMovimiento,
  restaStock,
  textoCantidadMovimiento,
} from '../../utils/stock/movimientos'
import EstadoBadge from '../listas/EstadoBadge'

// Fila‑tarjeta de un movimiento, sin tabla (plan de Stock v2/v3).
// móvil = 3 líneas · tablet (@xl) = 1 fila sin responsable (va con el motivo) · escritorio (@5xl) = 1 fila completa
export default function MovimientoCard({ movimiento: m }: { movimiento: Movimiento }) {
  const tipo = datosTipoMovimiento(m.tipo)
  const responsable = responsableMovimiento(m)
  const motivo = [descripcionMovimiento(m), m.detalle].filter(Boolean).join(' · ')

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg border-2 border-gray-200 bg-white px-3 py-3 @xl:grid-cols-[7.5rem_minmax(0,1fr)_5rem_7rem] @xl:px-4 @5xl:grid-cols-[7.5rem_minmax(0,1fr)_5rem_7rem_11rem] @5xl:py-2.5">
      <p className="col-start-1 row-start-1 whitespace-nowrap text-sm text-gray-600">
        <time dateTime={m.fecha}>{formatearFechaMovimiento(m.fecha)}</time>
      </p>
      <div className="col-start-1 col-end-3 row-start-2 min-w-0 @xl:col-start-2 @xl:col-end-3 @xl:row-start-1">
        <p className="truncate font-bold text-gray-900" title={m.insumo}>{m.insumo}</p>
        <p className="text-sm text-gray-600 @xl:truncate" title={motivo}>
          {motivo}
          <span className="@5xl:hidden"> · {responsable}</span>
        </p>
      </div>
      <p
        className={`col-start-2 row-start-1 justify-self-end whitespace-nowrap text-lg font-extrabold @xl:col-start-3 ${
          restaStock(m) ? 'text-red-700' : 'text-green-700'
        }`}
      >
        {textoCantidadMovimiento(m)}
      </p>
      <div className="col-start-1 row-start-3 @xl:col-start-4 @xl:row-start-1">
        <EstadoBadge texto={tipo.etiqueta} clases={tipo.clases} />
      </div>
      <p className="hidden truncate text-sm text-gray-600 @5xl:col-start-5 @5xl:row-start-1 @5xl:block">{responsable}</p>
    </li>
  )
}
