import { ArrowRight, StickyNote } from 'lucide-react'
import { formatearPrecio } from '../../utils/precio'

interface Props {
  cantidad: number
  subtotal: number
  logueado: boolean
  deshabilitado?: boolean
  /** Por qué no se puede continuar (si no viene, es porque la sucursal está cerrada) */
  motivo?: string
  onConfirmar: () => void
  /** Nota cargada desde NotaCocina (solo muestra aviso informativo si existe) */
  nota?: string
}

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const tarjetaResumenClase =
  'flex flex-col gap-3 rounded-3xl border-2 border-brand-dark bg-white p-4 shadow-sticker min-[380px]:gap-4 min-[380px]:rounded-[2rem] min-[380px]:p-5 sm:p-6'
const filaSubtotalClase =
  'flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-t-2 border-dashed border-brand-sand pt-3 min-[380px]:pt-4'
const montoSubtotalClase =
  'font-display text-2xl font-extrabold tabular-nums min-[380px]:text-3xl sm:text-4xl'
const avisoNotaClase =
  'flex items-center gap-2 rounded-xl border border-brand-dark/15 bg-brand-cream px-3 py-2 text-xs font-semibold text-brand-dark sm:text-sm'
const botonConfirmarClase =
  'flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-red px-4 text-center text-xs font-bold text-white transition-transform hover:translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 min-[380px]:min-h-13 min-[380px]:px-5 min-[380px]:text-sm sm:px-6 sm:text-base'

function ResumenCarrito({
  cantidad,
  subtotal,
  logueado,
  deshabilitado = false,
  motivo,
  onConfirmar,
  nota,
}: Props) {
  const tieneNota = Boolean(nota && nota.trim().length > 0)

  return (
    <aside className={tarjetaResumenClase}>
      <h2 className="font-display text-xl font-extrabold min-[380px]:text-2xl">Resumen</h2>

      <div className="flex flex-col gap-1.5 text-xs text-brand-muted min-[380px]:gap-2 min-[380px]:text-sm sm:text-base">
        <div className="flex justify-between gap-2">
          <span>
            {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </span>
          <span className="font-bold tabular-nums text-brand-dark">{formatearPrecio(subtotal)}</span>
        </div>

        <div className="flex justify-between gap-2">
          <span>Envío</span>
          <span className="text-right font-bold text-brand-dark">Se calcula con tu dirección</span>
        </div>
      </div>

      <div className={filaSubtotalClase}>
        <span className="text-sm font-extrabold min-[380px]:text-base">Subtotal</span>
        <span className={montoSubtotalClase}>{formatearPrecio(subtotal)}</span>
      </div>

      {tieneNota && (
        <div className={avisoNotaClase} role="status">
          <StickyNote className="h-4 w-4 shrink-0 text-brand-red" />
          <span>Se añadieron notas para la cocina</span>
        </div>
      )}

      <button type="button" onClick={onConfirmar} disabled={deshabilitado} className={botonConfirmarClase}>
        <span>{logueado ? 'Continuar' : 'Iniciá sesión para continuar'}</span>
        <ArrowRight className="h-4 w-4 shrink-0 min-[380px]:h-5 min-[380px]:w-5" />
      </button>

      {deshabilitado && (
        <p className="text-center text-xs font-semibold text-brand-red min-[380px]:text-sm">
          {motivo ?? 'La sucursal está cerrada. No se pueden generar pedidos ahora.'}
        </p>
      )}
    </aside>
  )
}

export default ResumenCarrito
