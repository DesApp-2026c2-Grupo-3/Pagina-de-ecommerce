import { Ban, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import type { CategoriaAdmin } from '../../types/categoria.types'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  categoria: CategoriaAdmin
  // Nombre de la principal si es subcategoría; null si es principal
  padre: string | null
  onEditar: (c: CategoriaAdmin) => void
  onCambiarEstado: (c: CategoriaAdmin) => void
  onEliminar: (c: CategoriaAdmin) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors @xl:h-9 @xl:w-9'

// Fila‑tarjeta de categoría, sin tabla (plan de Categorías v2). Columnas fijas y ubicación explícita:
// móvil: nombre y tipo con todo el ancho; abajo estado + productos · íconos
// tablet y escritorio (@xl): nombre/tipo · productos (8rem) · estado (9rem) · íconos
// Las subcategorías llevan sangría, «↳» y «Subcategoría de [Padre]».
export default function CategoriaCard({ categoria: c, padre, onEditar, onCambiarEstado, onEliminar }: Props) {
  const cantidad = c.cantidadProductos ?? 0
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border-2 border-gray-200 px-3 py-3 @xl:grid-cols-[minmax(0,1fr)_8rem_9rem_auto] @xl:px-4 @xl:py-2.5 ${
        padre !== null ? 'ml-5 @xl:ml-8' : ''
      } ${c.activo ? 'bg-white' : 'bg-gray-50'}`}
    >
      <div className="col-start-1 col-end-3 row-start-1 min-w-0 @xl:col-end-2">
        <p className="truncate font-bold text-gray-900" title={c.nombre}>
          {padre !== null && (
            <span className="font-normal text-gray-500" aria-hidden="true">
              ↳{' '}
            </span>
          )}
          {c.nombre}
        </p>
        <p className="truncate text-sm text-gray-600">
          {padre !== null ? `Subcategoría de ${padre}` : 'Categoría principal'}
        </p>
      </div>

      {/* Móvil: segunda línea con estado y productos a la izquierda y los íconos a la derecha; si no entran
          (teléfonos chicos con sangría), los íconos bajan a su propia línea. Desde @xl, cada uno en su columna */}
      <div className="col-start-1 col-end-3 row-start-2 flex flex-wrap items-center gap-2 @xl:contents">
        <div className="flex flex-col items-start gap-1 @xl:contents">
          <div className="@xl:col-start-3 @xl:row-start-1 @xl:justify-self-start">
            <EstadoBadge
              texto={c.activo ? 'Habilitada' : 'Deshabilitada'}
              clases={c.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}
            />
          </div>
          <p className="whitespace-nowrap text-sm text-gray-700 @xl:col-start-2 @xl:row-start-1">
            <span className="font-extrabold text-gray-900">{cantidad}</span> {cantidad === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {/* Los íconos de siempre, con sus nombres accesibles */}
        <div className="ml-auto flex justify-end gap-2 @xl:col-start-4 @xl:row-start-1 @xl:ml-0">
          <button
            type="button"
            onClick={() => onEditar(c)}
            aria-label={`Editar ${c.nombre}`}
            title="Editar categoría"
            className={`${icono} border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onCambiarEstado(c)}
            aria-label={`${c.activo ? 'Deshabilitar' : 'Habilitar'} ${c.nombre}`}
            title={c.activo ? 'Deshabilitar categoría' : 'Habilitar categoría'}
            className={`${icono} ${
              c.activo
                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100'
            }`}
          >
            {c.activo ? <Ban size={18} aria-hidden="true" /> : <CheckCircle size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => onEliminar(c)}
            aria-label={`Eliminar ${c.nombre}`}
            title="Eliminar categoría"
            className={`${icono} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
