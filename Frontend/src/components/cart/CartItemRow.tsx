import { Pencil, Trash2 } from 'lucide-react'
import QuantityStepper from '../product/QuantityStepper'
import CategoryIcon from '../icons/CategoryIcon'
import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { CartItem } from '../../types/cart'

interface Props {
  item: CartItem
  onCantidad: (cantidad: number) => void
  onQuitar: () => void
  /** Solo si el producto tiene algo para cambiar (tamaños o ingredientes) */
  onEditar?: () => void
}

const botonIcono = 'grid h-10 w-10 place-items-center rounded-xl text-brand-dark transition-colors'

// Una línea del carrito: foto, nombre con lo elegido, cantidad, subtotal y acciones
function CartItemRow({ item, onCantidad, onQuitar, onEditar }: Props) {
  const { product } = item
  const detalle = [
    etiquetaTamanio(item.tamanio, product.tamanios?.find((t) => t.tamanioId === item.tamanioId)?.etiqueta),
    ...item.selectedOptions,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-3xl border-2 border-brand-dark bg-white p-4">
      <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl ${product.id % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'}`}>
        {product.imagen ? (
          <img src={product.imagen} alt={product.nombre} className="h-16 w-16 object-contain" />
        ) : (
          <CategoryIcon icono="generico" className="h-10 w-10" />
        )}
      </div>

      <div className="min-w-0 flex-1 basis-40">
        <h3 className="font-display text-lg font-extrabold leading-tight text-brand-dark">{product.nombre}</h3>
        {detalle && <p className="text-sm text-brand-muted">{detalle}</p>}
        <p className="mt-1 text-sm font-bold text-brand-muted">{formatearPrecio(item.unitPrice)} c/u</p>
      </div>

      <div className="flex w-full items-center justify-between gap-3 border-t-2 border-dashed border-brand-sand pt-3 sm:w-auto sm:border-0 sm:pt-0">
        <QuantityStepper value={item.quantity} onChange={onCantidad} min={1} max={20} label={product.nombre} />
        <span className="min-w-24 text-right font-display text-xl font-extrabold text-brand-dark">
          {formatearPrecio(item.unitPrice * item.quantity)}
        </span>
        <div className="flex items-center">
          {onEditar && (
            <button type="button" onClick={onEditar} aria-label={`Editar ${product.nombre}`} className={`${botonIcono} hover:bg-brand-cream`}>
              <Pencil className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar ${product.nombre}`}
            className={`${botonIcono} hover:bg-brand-red/10 hover:text-brand-red`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default CartItemRow