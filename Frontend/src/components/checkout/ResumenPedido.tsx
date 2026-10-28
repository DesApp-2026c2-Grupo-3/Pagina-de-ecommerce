import { Timer } from 'lucide-react'
import { etiquetaTamanio } from '../../config/combo'
import { COSTO_ENVIO } from '../../config/compra'
import { formatearPrecio } from '../../utils/precio'
import type { CartItem } from '../../types/cart'

interface Props {
  lineas: CartItem[]
  total: number
  onConfirmar: () => void
  deshabilitado: boolean
  cargando: boolean
  textoBoton?: string
  demora?: string // ej: "25–35". Si no viene, no se muestra el aviso
}

const separador = 'border-t-2 border-dashed border-brand-dark/20'

// Columna derecha del checkout: qué se pide, el total y el botón para avanzar
function ResumenPedido({ lineas, total, onConfirmar, deshabilitado, cargando, textoBoton = 'Confirmar pedido', demora }: Props) {
  const totalConEnvio = COSTO_ENVIO === null ? total : total + COSTO_ENVIO

  return (
    <aside className="flex flex-col gap-5 rounded-[2rem] border-2 border-brand-dark bg-white p-7 shadow-[8px_8px_0_var(--color-brand-dark)]">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">Tu pedido</h2>

      <ul className="flex flex-col gap-4">
        {lineas.map((item) => {
          const detalle = [etiquetaTamanio(item.tamanio), ...item.selectedOptions].filter(Boolean).join(' · ')
          return (
            <li key={item.id} className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg">
                  <span className="font-extrabold">{item.quantity}×</span> {item.product.nombre}
                </p>
                {detalle && <p className="text-sm text-brand-muted">{detalle}</p>}
              </div>
              <span className="shrink-0 text-lg font-extrabold">{formatearPrecio(item.unitPrice * item.quantity)}</span>
            </li>
          )
        })}
      </ul>

      <div className={`flex flex-col gap-2 pt-5 text-lg ${separador}`}>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-extrabold">{formatearPrecio(total)}</span>
        </div>
        {/*
        <div className="flex justify-between">
          <span>Envío</span>
          <span className="font-extrabold">{COSTO_ENVIO === null ? 'A calcular' : formatearPrecio(COSTO_ENVIO)}</span>
        </div>
        */}
      </div>

      <div className={`flex items-center justify-between gap-4 pt-5 ${separador}`}>
        <span className="text-xl font-extrabold">Total</span>
        <span className="font-display text-4xl font-extrabold tracking-tight">
          {formatearPrecio(totalConEnvio)}
         {/*{COSTO_ENVIO === null && ' + envío'}*/}
        </span>
      </div>

      {demora && (
        <p className="flex items-center gap-3 rounded-2xl bg-brand-cream px-5 py-4 font-bold">
          <Timer className="h-6 w-6 shrink-0 text-brand-red" />
          Llega en {demora} min aprox.
        </p>
      )}

      <button
        type="button"
        onClick={onConfirmar}
        disabled={deshabilitado}
        className="min-h-16 rounded-full bg-brand-red px-6 text-lg font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {cargando ? 'Confirmando...' : textoBoton}
      </button>
    </aside>
  )
}

export default ResumenPedido