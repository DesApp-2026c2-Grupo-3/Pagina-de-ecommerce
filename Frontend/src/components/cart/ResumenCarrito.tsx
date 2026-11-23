import { useState } from 'react'
import { ArrowRight, ChevronDown, StickyNote } from 'lucide-react'
import { formatearPrecio } from '../../utils/precio'
//import CampoCupon from './CampoCupon'

interface Props {
  cantidad: number
  subtotal: number
  logueado: boolean
  deshabilitado?: boolean
  /** Por qué no se puede continuar (si no viene, es porque la sucursal está cerrada) */
  motivo?: string
  onConfirmar: () => void
  /** Nota para la cocina (opcional) */
  nota: string
  onCambiarNota: (valor: string) => void
}

// Resumen del carrito: subtotal, envío, cupón, total y botón para pasar al checkout
function ResumenCarrito({ cantidad, subtotal, logueado, deshabilitado = false, motivo, onConfirmar, nota, onCambiarNota }: Props) {
  // La nota arranca abierta solo si ya tiene texto
  const [notaAbierta, setNotaAbierta] = useState(() => nota.trim() !== '')    
  // El envío depende de la dirección: se suma en el checkout
    const total = subtotal  
    return (
    <aside className="flex flex-col gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker">
      <h2 className="font-display text-2xl font-extrabold">Resumen</h2>

      <div className="flex flex-col gap-2 text-brand-muted">
        <div className="flex justify-between">
          <span>
            {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </span>
          <span className="font-bold text-brand-dark">{formatearPrecio(subtotal)}</span>
        </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span className="font-bold text-brand-dark">Se calcula con tu dirección</span>
          </div>
      </div>
      {/*
      <div className="border-t-2 border-dashed border-brand-sand pt-4">
        <CampoCupon />
      </div>
      */}
      <div className="flex items-baseline justify-between border-t-2 border-dashed border-brand-sand pt-4">
        <span className="font-extrabold">Total</span> pasa a ser <span className="font-extrabold">Subtotal</span>        
        <span className="font-display text-4xl font-extrabold">{formatearPrecio(total)}</span>
      </div>
      <div className="rounded-xl border border-brand-dark/15 bg-brand-cream">
        <button
          type="button"
          onClick={() => setNotaAbierta((abierta) => !abierta)}
          aria-expanded={notaAbierta}
          aria-controls="nota-cocina"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-muted transition hover:text-brand-dark"
        >
          <StickyNote size={15} className="shrink-0" />
          <span className="flex-1 truncate">
            {!notaAbierta && nota.trim() ? `Nota: ${nota}` : 'Agregar nota para la cocina'}
          </span>
          <ChevronDown size={15} className={`shrink-0 transition ${notaAbierta ? 'rotate-180' : ''}`} />
        </button>

        {notaAbierta && (
          <div id="nota-cocina" className="flex items-center gap-2 border-t border-brand-dark/10 px-3 py-2">
            <input
              id="observaciones"
              type="text"
              value={nota}
              onChange={(e) => onCambiarNota(e.target.value)}
              maxLength={100}
              placeholder="Ej.: sin cebolla, bien cocida..."
              aria-label="Nota para la cocina"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-brand-dark outline-none placeholder:text-brand-muted/70"
            />
            <span className="shrink-0 text-xs text-brand-muted">{nota.length}/100</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onConfirmar}
        disabled={deshabilitado}
        className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {logueado ? 'Continuar' : 'Iniciá sesión para continuar'}
        <ArrowRight className="h-5 w-5" />
      </button>

      {deshabilitado && (
        <p className="text-center text-sm font-semibold text-brand-red">
          {motivo ?? 'La sucursal está cerrada. No se pueden generar pedidos ahora.'}        </p>
      )}
    </aside>
  )
}

export default ResumenCarrito