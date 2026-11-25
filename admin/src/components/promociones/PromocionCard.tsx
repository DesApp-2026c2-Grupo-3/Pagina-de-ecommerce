import { Ban, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { NOMBRE_TIPO } from '../../config/promociones'
import type { PromocionAdmin } from '../../types/promocion.types'
import { cuando, resumen } from '../../utils/promociones/textosPromocion'
import EstadoPromocion from './EstadoPromocion'

interface Props {
  promo: PromocionAdmin
  onEditar: (p: PromocionAdmin) => void
  onCambiarEstado: (p: PromocionAdmin) => void
  onEliminar: (p: PromocionAdmin) => void
}

const icono =
  'grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors @3xl:h-9 @3xl:w-9'

// Fila‑tarjeta de promoción, sin tabla (plan de Promociones v2). Columnas fijas y ubicación explícita:
// < 48 rem: círculo + nombre y «tipo · cuándo»; «Incluye» completo; estado e íconos (bajan si no entran)
// ≥ 48 rem: círculo (4,5 rem) · nombre + incluye (1fr) · tipo + cuándo (11 rem) · estado (10 rem) · íconos
export default function PromocionCard({ promo: p, onEditar, onCambiarEstado, onEliminar }: Props) {
  const incluye = resumen(p)
  return (
    <li
      className={`grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 rounded-lg border-2 border-gray-200 px-3 py-3 @3xl:grid-cols-[4.5rem_minmax(0,1fr)_11rem_10rem_auto] @3xl:items-center @3xl:px-4 @3xl:py-2.5 ${
        p.activo ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      {/* El círculo amarillo de siempre: «2×1», «20%», «Gratis» */}
      <span className="col-start-1 row-start-1 grid h-10 place-items-center self-center rounded-full bg-yellow-300 px-2 text-sm font-extrabold">
        {p.destacado}
      </span>

      <div className="col-start-2 row-start-1 min-w-0 self-center">
        <p className="font-bold text-gray-900 @3xl:truncate" title={p.titulo}>
          {p.titulo}
        </p>
        <p className="text-sm text-gray-600 @3xl:hidden">
          {NOMBRE_TIPO[p.tipo]} · {cuando(p)}
        </p>
        <p className="mt-0.5 hidden text-sm text-gray-700 @3xl:line-clamp-2" title={incluye}>
          {incluye}
        </p>
      </div>

      <p className="col-start-1 col-end-3 row-start-2 text-sm text-gray-700 @3xl:hidden">
        <span className="font-semibold text-gray-900">Incluye: </span>
        {incluye}
      </p>

      <div className="hidden text-sm @3xl:col-start-3 @3xl:row-start-1 @3xl:block">
        <p className="font-semibold text-gray-900">{NOMBRE_TIPO[p.tipo]}</p>
        <p className="text-gray-600">{cuando(p)}</p>
      </div>

      <div className="col-start-1 col-end-3 row-start-3 flex flex-wrap items-center gap-2 @3xl:contents">
        <div className="@3xl:col-start-4 @3xl:row-start-1">
          <EstadoPromocion promo={p} />
        </div>

        {/* Los íconos de siempre, con sus nombres accesibles */}
        <div className="ml-auto flex gap-2 @3xl:col-start-5 @3xl:row-start-1 @3xl:ml-0">
          <button
            type="button"
            onClick={() => onEditar(p)}
            aria-label={`Editar ${p.titulo}`}
            title="Editar promoción"
            className={`${icono} border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onCambiarEstado(p)}
            aria-label={`${p.activo ? 'Deshabilitar' : 'Habilitar'} ${p.titulo}`}
            title={p.activo ? 'Deshabilitar promoción' : 'Habilitar promoción'}
            className={`${icono} ${
              p.activo
                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border-emerald-300 bg-emerald-50 text-green-800 hover:bg-emerald-100'
            }`}
          >
            {p.activo ? <Ban size={18} aria-hidden="true" /> : <CheckCircle size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => onEliminar(p)}
            aria-label={`Eliminar ${p.titulo}`}
            title="Eliminar promoción"
            className={`${icono} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
