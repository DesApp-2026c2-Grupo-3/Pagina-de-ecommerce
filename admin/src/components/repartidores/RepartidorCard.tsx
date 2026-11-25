import { Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import type { Repartidor } from '../../types/repartidor.types'
import {
  ETIQUETA_ACTIVO,
  ETIQUETA_EN_VIAJE,
  ETIQUETA_INACTIVO,
  accionesBloqueadas,
} from '../../utils/repartidores/estadoRepartidor'
import { nombreCompleto } from '../../utils/repartidores/filtrarRepartidores'
import EstadoBadge from '../listas/EstadoBadge'

interface Props {
  repartidor: Repartidor
  // Solo el MASTER ve la sucursal de cada repartidor
  mostrarSucursal: boolean
  onEditar: (r: Repartidor) => void
  onDesactivar: (r: Repartidor) => void
  onReactivar: (r: Repartidor) => void
  onDarDeBaja: (r: Repartidor) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 @xl:h-9 @xl:w-9'

// Fila‑tarjeta de un repartidor, sin tabla (plan de Repartidores v2). Columnas fijas y ubicación explícita.
// móvil: nombre · email · (sucursal) · estado + íconos · tablet: datos | estado | íconos (sucursal bajo el email)
// escritorio: datos | (sucursal) | estado | íconos
export default function RepartidorCard({ repartidor: r, mostrarSucursal, onEditar, onDesactivar, onReactivar, onDarDeBaja }: Props) {
  const nombre = nombreCompleto(r)
  const bloqueado = accionesBloqueadas(r)
  const estado = r.activo ? ETIQUETA_ACTIVO : ETIQUETA_INACTIVO
  // Fila de estado e íconos: 3 en el admin de sucursal, 4 en el MASTER (por la sucursal)
  const filaAcciones = mostrarSucursal ? 'row-start-4' : 'row-start-3'
  const columnasEstado = mostrarSucursal
    ? '@xl:col-start-2 @xl:row-end-4 @5xl:col-start-3 @5xl:row-end-3'
    : '@xl:col-start-2 @xl:row-end-3'
  const columnasIconos = mostrarSucursal
    ? '@xl:col-start-3 @xl:row-end-4 @5xl:col-start-4 @5xl:row-end-3'
    : '@xl:col-start-3 @xl:row-end-3'

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg border-2 border-gray-200 px-3 py-3 @xl:grid-cols-[minmax(0,1fr)_11rem_auto] @xl:px-4 @5xl:py-2.5 ${
        mostrarSucursal ? '@5xl:grid-cols-[minmax(0,1fr)_10rem_11rem_auto]' : ''
      } ${r.activo ? 'bg-white' : 'bg-gray-50'}`}
    >
      <p className="col-start-1 col-end-3 row-start-1 truncate font-bold text-gray-900 @xl:col-end-2 @5xl:self-end" title={nombre}>
        {nombre}
      </p>
      <p className="col-start-1 col-end-3 row-start-2 truncate text-sm text-gray-600 @xl:col-end-2 @5xl:self-start" title={r.email}>
        {r.email}
      </p>
      {mostrarSucursal && (
        <p className="col-start-1 col-end-3 row-start-3 truncate text-sm text-gray-700 @xl:col-end-2 @5xl:col-start-2 @5xl:col-end-3 @5xl:row-start-1 @5xl:row-end-3">
          {r.sucursal?.nombre ?? 'Sin sucursal'}
        </p>
      )}

      {/* Cada etiqueta entera (nowrap): si no entran juntas, la segunda baja completa, sin encimarse */}
      <div className={`col-start-1 ${filaAcciones} flex flex-wrap items-center gap-1.5 @xl:row-start-1 ${columnasEstado}`}>
        <EstadoBadge texto={estado.texto} clases={estado.clases} />
        {r.tieneViajeEnCurso && <EstadoBadge texto={ETIQUETA_EN_VIAJE.texto} clases={ETIQUETA_EN_VIAJE.clases} />}
      </div>

      <div className={`col-start-2 ${filaAcciones} flex gap-2 self-center @xl:row-start-1 ${columnasIconos}`}>
        <button
          type="button"
          onClick={() => onEditar(r)}
          disabled={bloqueado}
          aria-label={`Editar a ${nombre}`}
          title={bloqueado ? 'No se puede editar: tiene un viaje en curso' : 'Editar repartidor'}
          className={`${icono} border-orange-300 text-orange-700 hover:bg-orange-50`}
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        {r.activo ? (
          <button
            type="button"
            onClick={() => onDesactivar(r)}
            disabled={bloqueado}
            aria-label={`Desactivar a ${nombre}`}
            title={bloqueado ? 'No se puede desactivar: tiene un viaje en curso' : 'Desactivar repartidor'}
            className={`${icono} border-red-300 text-red-700 hover:bg-red-50`}
          >
            <UserX size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReactivar(r)}
            aria-label={`Reactivar a ${nombre}`}
            title="Reactivar repartidor"
            className={`${icono} border-green-300 text-green-700 hover:bg-green-50`}
          >
            <UserCheck size={18} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDarDeBaja(r)}
          disabled={bloqueado}
          aria-label={`Dar de baja a ${nombre}`}
          title={bloqueado ? 'No se puede dar de baja: tiene un viaje en curso' : 'Dar de baja permanentemente'}
          className={`${icono} border-red-300 text-red-800 hover:bg-red-50`}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>

      {bloqueado && (
        <p className="col-span-full text-xs text-gray-600">
          Tiene un viaje en curso: no se puede editar, desactivar ni dar de baja hasta que termine.
        </p>
      )}
    </li>
  )
}
