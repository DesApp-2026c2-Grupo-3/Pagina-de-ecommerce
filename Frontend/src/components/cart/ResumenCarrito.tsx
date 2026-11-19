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
  'flex flex-col gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-5 shadow-sticker sm:p-6'
const filaSubtotalClase =
  'flex items-baseline justify-between gap-2 border-t-2 border-dashed border-brand-sand pt-4'
const avisoNotaClase =
  'flex items-center gap-2 rounded-xl border border-brand-dark/15 bg-brand-cream px-3 py-2 text-xs font-semibold text-brand-dark sm:text-sm'
const botonConfirmarClase =
  'flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-5 text-center text-sm font-bold text-white transition-transform hover:translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:text-base'

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
      <h2 className="font-display text-2xl font-extrabold">Resumen</h2>

      <div className="flex flex-col gap-2 text-sm text-brand-muted sm:text-base">
        <div className="flex justify-between gap-2">
          <span>
            {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </span>
          <span className="font-bold text-brand-dark">{formatearPrecio(subtotal)}</span>
        </div>

        <div className="flex justify-between gap-2">
          <span>Envío</span>
          <span className="text-right font-bold text-brand-dark">Se calcula con tu dirección</span>
        </div>
      </div>

      <div className={filaSubtotalClase}>
        <span className="font-extrabold">Subtotal</span>
        <span className="font-display text-3xl font-extrabold sm:text-4xl">{formatearPrecio(subtotal)}</span>
      </div>

      {tieneNota && (
        <div className={avisoNotaClase} role="status">
          <StickyNote className="h-4 w-4 shrink-0 text-brand-red" />
          <span>Se añadieron notas para la cocina</span>
        </div>
      )}

      <button type="button" onClick={onConfirmar} disabled={deshabilitado} className={botonConfirmarClase}>
        <span>{logueado ? 'Continuar' : 'Iniciá sesión para continuar'}</span>
        <ArrowRight className="h-5 w-5 shrink-0" />
      </button>

      {deshabilitado && (
        <p className="text-center text-sm font-semibold text-brand-red">
          {motivo ?? 'La sucursal está cerrada. No se pueden generar pedidos ahora.'}
        </p>
      )}
    </aside>
  )
}

export default ResumenCarrito
