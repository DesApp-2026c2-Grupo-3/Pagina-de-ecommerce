import { Bell, Plus } from 'lucide-react'
import type { ItemStock } from '../../types/stock.types'

interface StockFilaProps {
  item: ItemStock
  resaltado: boolean
  onDefinirMinimo: (item: ItemStock) => void
  onAumentar: (item: ItemStock) => void
}

function Estado({ item }: { item: ItemStock }) {
  if (!item.activo) {
    return (
      <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600">
        Deshabilitado
      </span>
    )
  }

  if (item.cantidad <= 0) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
        Sin stock
      </span>
    )
  }

  if (item.bajoMinimo) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
        Bajo
      </span>
    )
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
      Normal
    </span>
  )
}

function Acciones({
  item,
  onDefinirMinimo,
  onAumentar,
}: Omit<StockFilaProps, 'resaltado'>) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => onDefinirMinimo(item)}
        aria-label={`Definir mínimo de ${item.nombre}`}
        title="Definir mínimo (alerta)"
        className="rounded border bg-slate-100 p-2 text-gray-700 hover:text-amber-700"
      >
        <Bell size={18} />
      </button>
      <button
        type="button"
        onClick={() => onAumentar(item)}
        aria-label={`Aumentar ${item.nombre}`}
        title="Aumentar stock"
        className="inline-flex items-center gap-1 rounded border border-orange-300 bg-action p-2 text-sm font-semibold text-white hover:bg-action-hover md:px-3"
      >
        <Plus size={18} /> <span className="hidden md:inline">Aumentar</span>
      </button>
    </div>
  )
}

export function StockTarjeta({
  item,
  resaltado,
  onDefinirMinimo,
  onAumentar,
}: StockFilaProps) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg border bg-white p-4 ${
        resaltado ? 'border-amber-400 ring-2 ring-amber-200' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{item.nombre}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold">
            {item.cantidad.toLocaleString('es-AR')}
          </span>
          <Estado item={item} />
        </div>
        {item.stockMinimo != null && (
          <p className="mt-1 text-xs text-gray-500">
            Mínimo: {item.stockMinimo}
          </p>
        )}
      </div>
      <Acciones
        item={item}
        onDefinirMinimo={onDefinirMinimo}
        onAumentar={onAumentar}
      />
    </li>
  )
}

export default function StockFila({
  item,
  resaltado,
  onDefinirMinimo,
  onAumentar,
}: StockFilaProps) {
  return (
    <tr
      className={`border-t ${
        resaltado ? 'bg-amber-50 ring-2 ring-inset ring-amber-300' : ''
      }`}
    >
      <td className="px-6 py-4 font-medium">{item.nombre}</td>
      <td className="px-6 py-4">
        {item.cantidad.toLocaleString('es-AR')}
        {item.stockMinimo != null && (
          <span className="ml-2 text-xs text-gray-500">
            (mín. {item.stockMinimo})
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <Estado item={item} />
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end">
          <Acciones
            item={item}
            onDefinirMinimo={onDefinirMinimo}
            onAumentar={onAumentar}
          />
        </div>
      </td>
    </tr>
  )
}
