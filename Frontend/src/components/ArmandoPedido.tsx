import { Check, RotateCcw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Order } from '../types/order'
import { formatearPrecio } from '../utils/precio'

const MAX_LINEAS = 4

// Productos (de colores) que vuelan del ticket a la bolsa
const PRODUCTOS = [
  { x: '40px', y: '150px', r: '40deg', delay: 1.3, clase: 'left-[-150px] top-[-80px] h-10 w-14 rounded-[26px_26px_10px_10px] bg-[#e8a33d]' },
  { x: '-20px', y: '160px', r: '-30deg', delay: 1.6, clase: 'left-[-20px] top-[-110px] h-13 w-10 rounded-[6px_6px_12px_12px] bg-brand-red' },
  { x: '-70px', y: '150px', r: '60deg', delay: 1.9, clase: 'left-[90px] top-[-80px] h-12 w-11 rounded-[4px_4px_14px_14px] bg-brand-mustard' },
]

// Pantalla decorativa mientras se vuelve a armar un pedido viejo en el carrito.
// Va con portal al <body> porque el botón vive dentro de tarjetas (Home, Historial).
function ArmandoPedido({ pedido }: { pedido: Order }) {
  const lineas = pedido.DetallePedidos.slice(0, MAX_LINEAS)
  const resto = pedido.DetallePedidos.length - lineas.length

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pantalla-carga fixed inset-0 z-20 flex items-center justify-center bg-brand-cream px-4 pt-20 text-brand-dark"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[40vh] bg-brand-dark" />

      <div className="relative flex flex-col items-center gap-10 md:flex-row md:gap-28">
        {/* Ticket que se imprime con los productos del pedido que se repite */}
        <div aria-hidden="true" className="hidden flex-col items-center sm:flex">
          <div className="relative z-10 h-5 w-72 rounded-xl bg-brand-dark" />
          <div className="-mt-2 max-h-80 w-64 overflow-hidden">
            <div className="bf-ticket flex flex-col gap-3 border-[3px] border-t-0 border-brand-dark bg-white px-5 pb-7 pt-6 font-bold">
              <p className="text-center font-display text-2xl font-extrabold">Pedido #{pedido.id}</p>
              <div className="border-t-2 border-dashed border-[#d9cbc7]" />
              {lineas.map((d) => (
                <p key={d.id} className="truncate">
                  <span className="text-brand-red">{d.cantidad}×</span> {d.Producto.nombre}
                </p>
              ))}
              {resto > 0 && <p className="text-sm text-brand-muted">y {resto} más</p>}
              <div className="border-t-2 border-dashed border-[#d9cbc7]" />
              <div className="flex justify-between">
                <span>Total</span>
                <span>{formatearPrecio(Number(pedido.total))}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Productos que vuelan a la bolsa */}
        <div className="flex flex-col items-center gap-7">
          <div aria-hidden="true" className="relative h-0">
            {PRODUCTOS.map((p) => (
              <span
                key={p.delay}
                className={`bf-volar absolute border-[3px] border-brand-dark ${p.clase}`}
                style={{ '--x': p.x, '--y': p.y, '--r': p.r, animationDelay: `${p.delay}s` } as CSSProperties}
              />
            ))}
          </div>
          <div aria-hidden="true" className="bf-bolsa relative mt-24 h-52 w-48">
            <div className="absolute -top-9 left-14 h-16 w-20 rounded-t-[40px] border-[6px] border-b-0 border-brand-dark" />
            <div className="absolute inset-0 grid place-items-center rounded-[20px_20px_32px_32px] border-[3px] border-brand-dark bg-brand-red shadow-sticker">
              <span className="font-display text-3xl font-extrabold text-brand-cream">BF</span>
            </div>
            <span
              className="bf-pop absolute -right-4 -top-4 grid h-12 w-12 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard"
              style={{ animationDelay: '2.4s' }}
            >
              <Check className="h-6 w-6" strokeWidth={3.5} />
            </span>
          </div>
          <p className="bf-subir flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight" style={{ animationDelay: '0.2s' }}>
            <RotateCcw aria-hidden="true" className="bf-girar-lento h-6 w-6 text-brand-red" strokeWidth={2.8} />
            Armando tu pedido otra vez
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ArmandoPedido