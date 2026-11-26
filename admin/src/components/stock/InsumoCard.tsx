import { Bell, Plus } from 'lucide-react'
import type { ItemStock } from '../../types/stock.types'
import { ESTADOS_INSUMO, estadoInsumo } from '../../utils/stock/estadoInsumo'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  item: ItemStock
  // Insumo que abrió un aviso de stock bajo: recuadro ámbar unos segundos
  resaltado: boolean
  onDefinirMinimo: (item: ItemStock) => void
  onAumentar: (item: ItemStock) => void
}

// Fila‑tarjeta de un insumo, sin tabla (plan de Stock v2/v3). Columnas fijas y ubicación explícita:
// móvil = 3 líneas · tablet (@xl) = 2 líneas · escritorio (@5xl) = 1 fila.
export default function InsumoCard({ item, resaltado, onDefinirMinimo, onAumentar }: Props) {
  const estado = ESTADOS_INSUMO[estadoInsumo(item)]
  const sinStock = item.cantidad <= 0

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg border-2 px-3 py-3 @xl:grid-cols-[minmax(0,1fr)_8rem_9rem] @xl:px-4 @5xl:grid-cols-[minmax(0,1fr)_8rem_9rem_15rem] @5xl:py-2.5 ${
        item.activo ? 'bg-white' : 'bg-gray-50'
      } ${resaltado ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'}`}
    >
      <p className="col-start-1 col-end-3 row-start-1 truncate font-bold text-gray-900 @xl:col-end-2 @5xl:self-end" title={item.nombre}>
        {item.nombre}
      </p>
      <p className="col-start-1 row-start-2 text-sm text-gray-600 @5xl:self-start">
        {item.stockMinimo != null ? `Mínimo ${item.stockMinimo.toLocaleString('es-AR')}` : 'Sin mínimo (no avisa)'}
      </p>
      <p className="col-start-2 row-start-2 justify-self-end whitespace-nowrap @xl:row-start-1 @xl:justify-self-start @5xl:row-end-3">
        <span className={`text-xl font-extrabold ${sinStock ? 'text-red-700' : 'text-gray-900'}`}>
          {item.cantidad.toLocaleString('es-AR')}
        </span>{' '}
        <span className="text-sm text-gray-600">en stock</span>
      </p>
      <div className="col-start-1 row-start-3 @xl:col-start-3 @xl:row-start-1 @5xl:row-end-3">
        <EstadoBadge texto={estado.etiqueta} clases={estado.clases} />
      </div>
      <div className="col-start-2 row-start-3 mt-1 flex justify-end gap-2 @xl:col-start-2 @xl:col-end-4 @xl:row-start-2 @xl:mt-0 @5xl:col-start-4 @5xl:col-end-5 @5xl:row-start-1 @5xl:row-end-3">
        <button
          type="button"
          onClick={() => onDefinirMinimo(item)}
          aria-label={`Definir el mínimo de ${item.nombre}`}
          title="Definir mínimo (alerta)"
          className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 @xl:min-h-9"
        >
          <Bell size={16} aria-hidden="true" /> Mínimo
        </button>
        <button
          type="button"
          onClick={() => onAumentar(item)}
          disabled={!item.activo}
          aria-label={`Aumentar el stock de ${item.nombre}`}
          title={item.activo ? 'Aumentar stock' : 'Insumo deshabilitado: no se repone, se usa hasta agotar stock'}
          className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-orange-700 px-3 text-sm font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:border disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 @xl:min-h-9"
        >
          <Plus size={16} aria-hidden="true" /> Aumentar
        </button>
      </div>
    </li>
  )
}
