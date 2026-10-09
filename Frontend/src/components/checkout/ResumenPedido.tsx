import { ShoppingBag } from 'lucide-react'
import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { CartItem } from '../../types/cart'

interface Props {
  lineas: CartItem[]
  total: number
  onConfirmar: () => void
  deshabilitado: boolean
  cargando: boolean
}

// Columna derecha del checkout: qué se pide, el total y el botón de confirmar
function ResumenPedido({ lineas, total, onConfirmar, deshabilitado, cargando }: Props) {
  return (
    <aside className="flex flex-col gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker lg:sticky lg:top-28">
      <h2 className="font-display text-2xl font-extrabold">Tu pedido</h2>

      <ul className="flex flex-col gap-3">
        {lineas.map((item) => {
          const detalle = [etiquetaTamanio(item.tamanio), ...item.selectedOptions].filter(Boolean).join(' · ')
          return (
            <li key={item.id} className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">
                  <span className="text-brand-red">{item.quantity}×</span> {item.product.nombre}
                </p>
                {detalle && <p className="text-sm text-brand-muted">{detalle}</p>}
              </div>
              <span className="shrink-0 font-bold">{formatearPrecio(item.unitPrice * item.quantity)}</span>
            </li>
          )
        })}
      </ul>

      <div className="flex items-baseline justify-between border-t-2 border-dashed border-brand-sand pt-4">
        <span className="font-extrabold">Total</span>
        <span className="font-display text-4xl font-extrabold">{formatearPrecio(total)}</span>
      </div>

      <button
        type="button"
        onClick={onConfirmar}
        disabled={deshabilitado}
        className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingBag className="h-5 w-5" />
        {cargando ? 'Confirmando...' : 'Confirmar pedido'}
      </button>
    </aside>
  )
}

export default ResumenPedido