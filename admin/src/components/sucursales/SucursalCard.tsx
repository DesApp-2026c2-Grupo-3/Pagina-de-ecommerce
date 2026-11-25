import { Boxes, Eye, Power } from 'lucide-react'
import type { Sucursal } from '../../types/sucursal.types'
import { formatearHorario } from '../../utils/horario'
import { textoDireccion } from '../../utils/sucursales/filtrarSucursales'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  sucursal: Sucursal
  onVerDetalles: (s: Sucursal) => void
  onVerStock: (s: Sucursal) => void
  onCambiarEstado: (s: Sucursal) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors @3xl:h-9 @3xl:w-9'

// Tarjeta individual de sucursal, sin tabla (plan de Sucursales v3). Columnas fijas y ubicación explícita:
// < 48 rem: nombre, dirección y horario arriba; estado e íconos abajo (los íconos bajan si no entran)
// ≥ 48 rem: nombre + dirección + horario (1fr) · estado (8 rem) · íconos
export default function SucursalCard({ sucursal: s, onVerDetalles, onVerStock, onCambiarEstado }: Props) {
  const direccion = textoDireccion(s)
  const horario = formatearHorario(s.horario)
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border-2 border-gray-200 px-3 py-3 @3xl:grid-cols-[minmax(0,1fr)_8rem_auto] @3xl:px-4 @3xl:py-2.5 ${
        s.activa ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <div className="col-start-1 col-end-3 row-start-1 min-w-0 @3xl:col-end-2">
        <p className="truncate font-bold text-gray-900" title={s.nombre}>
          {s.nombre}
        </p>
        {direccion && (
          <p className="truncate text-sm text-gray-600" title={direccion}>
            {direccion}
          </p>
        )}
        {/* Horario como hoy: una línea de hasta 16 rem, cortada; el texto completo en el title (D-SU2) */}
        <p className="mt-1 block max-w-64 truncate text-sm text-gray-600" title={horario}>
          {horario}
        </p>
      </div>

      <div className="col-start-1 col-end-3 row-start-2 flex flex-wrap items-center gap-2 @3xl:contents">
        <div className="@3xl:col-start-2 @3xl:row-start-1">
          <EstadoBadge
            texto={s.activa ? 'Activa' : 'Inactiva'}
            clases={s.activa ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}
          />
        </div>

        {/* Los íconos de siempre, con sus nombres accesibles */}
        <div className="ml-auto flex gap-2 @3xl:col-start-3 @3xl:row-start-1 @3xl:ml-0">
          <button
            type="button"
            onClick={() => onVerDetalles(s)}
            aria-label={`Ver detalles de ${s.nombre}`}
            title="Ver detalles"
            className={`${icono} border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100`}
          >
            <Eye size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onVerStock(s)}
            aria-label={`Ver stock de ${s.nombre}`}
            title="Ver stock"
            className={`${icono} border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100`}
          >
            <Boxes size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onCambiarEstado(s)}
            aria-label={`${s.activa ? 'Desactivar' : 'Activar'} ${s.nombre}`}
            title={s.activa ? 'Desactivar (deja de recibir pedidos)' : 'Activar'}
            className={`${icono} ${
              s.activa
                ? 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-red-700'
                : 'border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100'
            }`}
          >
            <Power size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
