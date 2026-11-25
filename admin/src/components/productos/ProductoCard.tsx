import { Ban, Boxes, CircleCheck, Eye, Image as IconoImagen, Trash2 } from 'lucide-react'
import type { ProductoFila } from '../../types/producto.types'
import { formatearPrecio } from '../../utils/pedidos/resumenPedido'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  producto: ProductoFila
  // Nombre de la categoría, tal cual (D-P4); null si no tiene
  categoria: string | null
  onVerDetalles: (p: ProductoFila) => void
  onVerStock: (p: ProductoFila) => void
  onAlternarDisponibilidad: (p: ProductoFila) => void
  onEliminar: (p: ProductoFila) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors @xl:h-9 @xl:w-9'

// Fila‑tarjeta de producto, sin tabla (plan de Productos v2). Columnas fijas y ubicación explícita:
// móvil: [img] nombre/categoría · precio, y abajo estado + íconos · tablet: [img] datos · precio · íconos, estado abajo
// escritorio: [img] datos · precio · estado · íconos
export default function ProductoCard({ producto: p, categoria, onVerDetalles, onVerStock, onAlternarDisponibilidad, onEliminar }: Props) {
  return (
    <li
      className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border-2 border-gray-200 px-3 py-3 @xl:grid-cols-[3rem_minmax(0,1fr)_7rem_auto] @xl:px-4 @5xl:grid-cols-[3rem_minmax(0,1fr)_7rem_9rem_auto] @5xl:py-2.5 ${
        p.disponible ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <div className="col-start-1 row-start-1 @5xl:row-end-3">
        {p.imagen ? (
          <img src={p.imagen} alt="" loading="lazy" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-gray-200 text-gray-500">
            <IconoImagen size={20} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="col-start-2 row-start-1 min-w-0 @5xl:row-end-3">
        <p className="truncate font-bold text-gray-900" title={p.nombre}>
          {p.nombre}
        </p>
        {categoria && <p className="truncate text-sm text-gray-600">{categoria}</p>}
      </div>

      <p className="col-start-3 row-start-1 justify-self-end whitespace-nowrap font-extrabold text-gray-900 @xl:justify-self-start @5xl:row-end-3">
        {formatearPrecio(p.precio)}
      </p>

      <div className="col-start-1 col-end-4 row-start-2 justify-self-start @xl:col-end-5 @5xl:col-start-4 @5xl:col-end-5 @5xl:row-start-1 @5xl:row-end-3">
        <EstadoBadge
          texto={p.disponible ? 'Habilitado' : 'Inhabilitado'}
          clases={p.disponible ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}
        />
      </div>

      {/* Los íconos de siempre, con sus nombres accesibles */}
      <div className="col-start-1 col-end-4 row-start-2 flex gap-2 justify-self-end @xl:col-start-4 @xl:col-end-5 @xl:row-start-1 @5xl:col-start-5 @5xl:col-end-6 @5xl:row-end-3">
        <button
          type="button"
          onClick={() => onVerDetalles(p)}
          aria-label={`Ver detalles de ${p.nombre}`}
          title="Ver detalles"
          className={`${icono} border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100`}
        >
          <Eye size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onVerStock(p)}
          aria-label={`Ver stock de ${p.nombre}`}
          title="Ver stock"
          className={`${icono} border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100`}
        >
          <Boxes size={18} aria-hidden="true" />
        </button>
        {/* Inhabilitar / habilitar: se puede deshacer con el mismo botón */}
        <button
          type="button"
          onClick={() => onAlternarDisponibilidad(p)}
          aria-label={`${p.disponible ? 'Inhabilitar' : 'Habilitar'} ${p.nombre}`}
          title={p.disponible ? 'Inhabilitar' : 'Habilitar'}
          className={`${icono} ${
            p.disponible
              ? 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100'
          }`}
        >
          {p.disponible ? <Ban size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
        </button>
        {/* Eliminar: baja lógica (RN-16), con confirmación */}
        <button
          type="button"
          onClick={() => onEliminar(p)}
          aria-label={`Eliminar ${p.nombre}`}
          title="Eliminar"
          className={`${icono} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
