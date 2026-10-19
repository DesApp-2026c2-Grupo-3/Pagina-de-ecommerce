import { Pencil, Tag, Trash2 } from 'lucide-react'
import QuantityStepper from '../product/QuantityStepper'
import CategoryIcon from '../icons/CategoryIcon'
import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import { useCart } from '../../context/CartContext'
import type { CartItem } from '../../types/cart'

interface Props {
  item: CartItem
  onCantidad: (cantidad: number) => void
  onQuitar: () => void
  /** Solo si el producto tiene algo para cambiar (tamaños o ingredientes) */
  onEditar?: () => void
}

const botonIcono = 'grid h-10 w-10 place-items-center rounded-xl text-brand-dark transition-colors'

// "20% OFF", "50% OFF", "GRATIS"
const etiquetaDescuento = (d: number) => (d >= 1 ? 'GRATIS' : `${Math.round(d * 100)}% OFF`)

// Una línea del carrito: foto, nombre con lo elegido, cantidad, subtotal y acciones.
// Las líneas de promo muestran el precio de lista tachado; las promos "cerradas" no cambian de cantidad
// y al quitarlas se va la promo completa.
function CartItemRow({ item, onCantidad, onQuitar, onEditar }: Props) {
  const { removePromo } = useCart()
  const { product } = item
  const conDescuento = Boolean(item.descuento && item.precioLista && item.precioLista > item.unitPrice)
  const detalle = [
    etiquetaTamanio(item.tamanio, product.tamanios?.find((t) => t.tamanioId === item.tamanioId)?.etiqueta),
    ...item.selectedOptions.filter((t) => !t.startsWith('Promo:')),
  ]
    .filter(Boolean)
    .join(' · ')
  const promo = item.selectedOptions.find((t) => t.startsWith('Promo:'))?.replace('Promo:', '').trim()

  const quitar = () => (item.promoFija && item.promoId ? removePromo(item.promoId) : onQuitar())

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
        {promo && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-extrabold text-white">
            <Tag className="h-3 w-3" /> {promo}
            {item.descuento ? ` · ${etiquetaDescuento(item.descuento)}` : ''}
          </span>
        )}
        <h3 className="font-display text-lg font-extrabold leading-tight text-brand-dark">{product.nombre}</h3>
        {detalle && <p className="text-sm text-brand-muted">{detalle}</p>}
        <p className="mt-1 text-sm font-bold text-brand-muted">
          {conDescuento && <s className="mr-1.5 font-semibold">{formatearPrecio(item.precioLista!)}</s>}
          {item.unitPrice === 0 ? 'Gratis' : `${formatearPrecio(item.unitPrice)} c/u`}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-brand-sand pt-3 sm:w-auto sm:border-0 sm:pt-0">
        {item.promoFija ? (
          <span className="rounded-full bg-brand-cream px-4 py-2 font-bold text-brand-dark">× {item.quantity}</span>
        ) : (
          <QuantityStepper value={item.quantity} onChange={onCantidad} min={1} max={20} label={product.nombre} />
        )}
        <span className="text-right font-display text-xl font-extrabold text-brand-dark sm:min-w-24">
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
            onClick={quitar}
            aria-label={item.promoFija ? `Quitar la promo ${promo ?? ''}` : `Quitar ${product.nombre}`}
            title={item.promoFija ? 'Quita la promo completa' : undefined}
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
