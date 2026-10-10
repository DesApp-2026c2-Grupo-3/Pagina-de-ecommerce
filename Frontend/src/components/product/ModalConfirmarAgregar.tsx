import { ShoppingBag } from 'lucide-react'
import Modal from '../Modal'
import { formatearPrecio } from '../../utils/precio'

interface Props {
  abierto: boolean
  nombre: string
  imagen: string | null
  /** Resumen de lo elegido: tamaño, combo, ingredientes, nota */
  detalle: string
  cantidad: number
  total: number
  onCancelar: () => void
  onConfirmar: () => void
}

// "¿Lo sumamos al carrito?": repaso del producto antes de agregarlo
function ModalConfirmarAgregar({ abierto, nombre, imagen, detalle, cantidad, total, onCancelar, onConfirmar }: Props) {
  return (
    <Modal isOpen={abierto} onClose={onCancelar} title="¿Lo sumamos al carrito?" tamanio="sm">
      <div className="flex items-center gap-4 rounded-2xl border-2 border-brand-dark bg-white p-3">
        <span className="grid h-16 w-16 shrink-0 -rotate-3 place-items-center rounded-2xl bg-brand-red">
          {imagen && <img src={imagen} alt="" className="h-14 w-14 rotate-3 object-contain" />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-extrabold leading-tight">
            <span className="text-brand-red">{cantidad}×</span> {nombre}
          </p>
          {detalle && <p className="mt-0.5 text-sm text-brand-muted">{detalle}</p>}
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t-2 border-dashed border-brand-sand pt-4">
        <span className="font-extrabold">Total</span>
        <span className="font-display text-3xl font-extrabold">{formatearPrecio(total)}</span>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-11 rounded-full border-2 border-brand-dark px-5 font-bold transition-colors hover:bg-brand-dark hover:text-brand-cream"
        >
          Seguir editando
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          <ShoppingBag className="h-4 w-4" /> Sí, agregar
        </button>
      </div>
    </Modal>
  )
}

export default ModalConfirmarAgregar