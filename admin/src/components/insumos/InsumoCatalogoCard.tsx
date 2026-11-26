import { Ban, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import type { Insumo } from '../../types/insumo.types'
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

// Fila‑tarjeta de insumo del catálogo, sin tabla (plan de ajustes de Insumos y Stock v1). Otra que
// components/stock/InsumoCard. Solo nombre, estado e íconos: el precio por extra y el mínimo se ven al editar.
// Hasta 36 rem, en dos líneas: nombre; abajo estado e íconos. Desde 36 rem, una fila: nombre · estado · íconos.
export default function InsumoCatalogoCard({ insumo: i, editando, onEditar, onCambiarEstado, onEliminar }: Props) {
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border-2 px-3 py-3 @xl:grid-cols-[minmax(0,1fr)_auto_auto] @3xl:px-4 @3xl:py-2.5 ${
        editando ? 'border-orange-300 bg-orange-50' : i.activo ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <p className="col-start-1 col-end-3 row-start-1 flex min-w-0 items-center gap-2 @xl:col-end-2">
        <span className="truncate font-bold text-gray-900" title={i.nombre}>
          {i.nombre}
        </span>
        {editando && (
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-800">
            Editando
          </span>
        )}
      </p>

      <div className="col-start-1 row-start-2 @xl:col-start-2 @xl:row-start-1">
        <EstadoBadge
          texto={i.activo ? 'Habilitado' : 'Deshabilitado'}
          clases={i.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}
        />
      </div>

      {/* Los íconos de siempre, con sus nombres accesibles */}
      <div className="col-start-2 row-start-2 flex gap-2 justify-self-end @xl:col-start-3 @xl:row-start-1">
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
    </li>
  )
}
