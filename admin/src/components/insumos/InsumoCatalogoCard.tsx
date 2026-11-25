import { Ban, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import type { Insumo } from '../../types/insumo.types'
import { textoPrecioExtra, textoStockMinimo } from '../../utils/insumos/filtrarInsumos'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  insumo: Insumo
  editando: boolean
  onEditar: (i: Insumo) => void
  onCambiarEstado: (i: Insumo) => void
  onEliminar: (i: Insumo) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors @3xl:h-9 @3xl:w-9'

// Fila‑tarjeta de insumo del catálogo, sin tabla (plan de Insumos v3). Otra que components/stock/InsumoCard.
// Hasta 48 rem, apilada: nombre; abajo estado + «Extra · Mín.» e íconos (bajan de línea si no entran).
// Desde 48 rem, en columnas: nombre · extra (8rem) · mínimo (8rem) · estado (9rem) · íconos.
export default function InsumoCatalogoCard({ insumo: i, editando, onEditar, onCambiarEstado, onEliminar }: Props) {
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border-2 px-3 py-3 @3xl:grid-cols-[minmax(0,1fr)_8rem_8rem_9rem_auto] @3xl:px-4 @3xl:py-2.5 ${
        editando ? 'border-orange-300 bg-orange-50' : i.activo ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <p className="col-start-1 col-end-3 row-start-1 flex min-w-0 items-center gap-2 @3xl:col-end-2">
        <span className="truncate font-bold text-gray-900" title={i.nombre}>
          {i.nombre}
        </span>
        {editando && (
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-800">
            Editando
          </span>
        )}
      </p>

      <div className="col-start-1 col-end-3 row-start-2 flex flex-wrap items-center gap-2 @3xl:contents">
        <div className="flex flex-col items-start gap-1 @3xl:contents">
          <div className="@3xl:col-start-4 @3xl:row-start-1 @3xl:justify-self-start">
            <EstadoBadge
              texto={i.activo ? 'Habilitado' : 'Deshabilitado'}
              clases={i.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}
            />
          </div>
          <p className="text-sm text-gray-700 @3xl:contents">
            <span className="whitespace-nowrap @3xl:col-start-2 @3xl:row-start-1">
              <span className="text-gray-600" aria-hidden="true">Extra </span>
              <span className="sr-only">Precio por extra: </span>
              <span className="font-extrabold text-gray-900">{textoPrecioExtra(i)}</span>
            </span>
            <span className="@3xl:hidden" aria-hidden="true"> · </span>
            <span className="whitespace-nowrap @3xl:col-start-3 @3xl:row-start-1">
              <span className="text-gray-600" aria-hidden="true">Mín. </span>
              <span className="sr-only">Stock mínimo sugerido: </span>
              <span className="font-extrabold text-gray-900">{textoStockMinimo(i)}</span>
            </span>
          </p>
        </div>

        {/* Los íconos de siempre, con sus nombres accesibles */}
        <div className="ml-auto flex gap-2 @3xl:col-start-5 @3xl:row-start-1 @3xl:ml-0">
          <button
            type="button"
            onClick={() => onEditar(i)}
            aria-label={`Editar ${i.nombre}`}
            title="Editar"
            className={`${icono} border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onCambiarEstado(i)}
            aria-label={`${i.activo ? 'Deshabilitar' : 'Habilitar'} ${i.nombre}`}
            title={i.activo ? 'Deshabilitar (no se repone; se usa hasta agotar stock)' : 'Habilitar insumo'}
            className={`${icono} ${
              i.activo
                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100'
            }`}
          >
            {i.activo ? <Ban size={18} aria-hidden="true" /> : <CheckCircle size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => onEliminar(i)}
            aria-label={`Eliminar ${i.nombre}`}
            title="Eliminar"
            className={`${icono} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
