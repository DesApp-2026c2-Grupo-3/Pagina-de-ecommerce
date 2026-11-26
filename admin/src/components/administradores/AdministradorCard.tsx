import { Pencil, Power, RotateCcw } from 'lucide-react'
import type { AdministradorFila } from '../../types/administrador.types'
import { rolTexto } from '../../utils/administradores/filtrarAdministradores'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  admin: AdministradorFila
  onEditar: (a: AdministradorFila) => void
  onDesactivar: (a: AdministradorFila) => void
  onReactivar: (a: AdministradorFila) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors @5xl:h-9 @5xl:w-9'

// Celular (< 36 rem): mail y sucursal en una línea, cortados con «…» · desde tablet: completos, pueden bajar de línea
const ajuste = 'truncate @xl:whitespace-normal @xl:[overflow-wrap:anywhere]'

// Tarjeta de administrador, sin tabla (plan de Administradores v6 = diseño v3).
// < 64 rem: nombre y mail; Rol | Sucursal (auto | 1fr); estado e íconos (bajan si no entran)
// ≥ 64 rem: nombre + mail (1fr) · rol (6,5 rem) · sucursal (hasta 15 rem) · estado (7 rem) · íconos
export default function AdministradorCard({ admin: a, onEditar, onDesactivar, onReactivar }: Props) {
  const sucursal = a.sucursal?.nombre ?? 'Sin sucursal'
  return (
    <li
      className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 rounded-lg border-2 border-gray-200 px-3 py-3 @5xl:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,15rem)_7rem_auto] @5xl:gap-x-4 @5xl:px-4 @5xl:py-2.5 ${
        a.activo ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <div className="col-span-2 min-w-0 @5xl:col-span-1">
        <p className={`font-bold text-gray-900 ${ajuste}`} title={a.nombre}>
          {a.nombre}
        </p>
        <p className={`text-sm text-gray-600 ${ajuste}`} title={a.email}>
          {a.email}
        </p>
      </div>

      <p className="min-w-0 text-sm">
        <span className="block text-xs text-gray-600">Rol</span>
        <span className="block font-semibold text-gray-900">{rolTexto(a.rol)}</span>
      </p>
      <p className="min-w-0 text-sm">
        <span className="block text-xs text-gray-600">Sucursal</span>
        <span className={`block font-semibold text-gray-900 ${ajuste}`} title={sucursal}>
          {sucursal}
        </span>
      </p>

      <div className="col-span-2 flex flex-wrap items-center gap-2 @5xl:contents">
        <div>
          <EstadoBadge
            texto={a.activo ? 'Activo' : 'Inactivo'}
            clases={a.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          />
        </div>

        {/* Los íconos de siempre: Editar, y Desactivar (con confirmación) o Reactivar según el estado */}
        <div className="ml-auto flex gap-2 @5xl:ml-0">
          <button
            type="button"
            onClick={() => onEditar(a)}
            aria-label={`Editar ${a.nombre}`}
            title="Editar"
            className={`${icono} border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          {a.activo ? (
            <button
              type="button"
              onClick={() => onDesactivar(a)}
              aria-label={`Desactivar ${a.nombre}`}
              title="Desactivar"
              className={`${icono} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}
            >
              <Power size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReactivar(a)}
              aria-label={`Reactivar ${a.nombre}`}
              title="Reactivar"
              className={`${icono} border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100`}
            >
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
