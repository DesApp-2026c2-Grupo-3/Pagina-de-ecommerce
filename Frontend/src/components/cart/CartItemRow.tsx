import { useState } from 'react'
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

const botonIcono = 'grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl text-brand-dark transition-colors'

// "20% OFF", "50% OFF", "GRATIS"
const etiquetaDescuento = (d: number) => (d >= 1 ? 'GRATIS' : `${Math.round(d * 100)}% OFF`)

function CartItemRow({ item, onCantidad, onQuitar, onEditar }: Props) {
  const { removePromo } = useCart()
  const [imagenRota, setImagenRota] = useState(false)
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
    <article className="flex flex-row items-center gap-3 sm:gap-4 rounded-3xl border-2 border-brand-dark bg-white p-3 sm:p-4 w-full">
      
      {/* 🖼️ FOTO RESTAURADA AL TAMAÑO ORIGINAL: Clavada firme en h-20 w-20 siempre */}
      <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-brand-dark/10 shadow-sm ${product.id % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'}`}>
        {product.imagen && !imagenRota ? (
          <img
            src={product.imagen}
            alt={product.nombre}
            onError={() => setImagenRota(true)}
            className="h-16 w-16 object-contain"
          />
        ) : (
          <CategoryIcon icono="generico" className="h-10 w-10" />
        )}
      </div>

      {/* 📝 CONTENEDOR ELÁSTICO DERECHO */}
      <div className="flex flex-col flex-1 min-w-0 gap-1.5 justify-between h-full">
        
        {/* BLOQUE SUPERIOR: Título, Promos y Precio unitario */}
        <div className="min-w-0 pr-1">
          {promo && (
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-[10px] sm:text-xs font-extrabold text-white">
              <Tag className="h-2.5 w-2.5" /> {promo}
              {item.descuento ? ` · ${etiquetaDescuento(item.descuento)}` : ''}
            </span>
          )}
          <h3 className="font-display text-sm sm:text-lg font-extrabold leading-tight text-brand-dark truncate">{product.nombre}</h3>
          {detalle && <p className="text-[11px] sm:text-sm text-brand-muted truncate mt-0.5">{detalle}</p>}
          <p className="text-[11px] sm:text-sm font-bold text-brand-muted mt-0.5 leading-none">
            {conDescuento && <s className="mr-1.5 font-semibold">{formatearPrecio(item.precioLista!)}</s>}
            {item.unitPrice === 0 ? 'Gratis' : `${formatearPrecio(item.unitPrice)} c/u`}
          </p>
        </div>

        {/* CONTROLES Y ACCIONES (Riel inferior unificado al lado de la imagen) */}
        <div className="flex w-full flex-row items-center justify-between gap-1 sm:gap-3 border-0 pt-0 sm:border-t-2 sm:border-dashed sm:border-brand-sand sm:pt-3">
          
          {/* 
            🛠️ COMPACTACIÓN MÁXIMA DEL BOTÓN INCREMENTADOR:
            - Usamos `scale-[0.82]` para aplanarlo de forma quirúrgica en mobile.
            - `max-w-[85px]` impide que empuje o desplace los precios en pantallas de 360px.
            - md:scale-100 y md:max-w-none restauran el layout original en PC.
          */}
          <div className="scale-[0.82] sm:scale-100 origin-left shrink-0 max-w-[85px] sm:max-w-none">
            {item.promoFija ? (
              <span className="rounded-full bg-brand-cream px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-brand-dark">× {item.quantity}</span>
            ) : (
              <QuantityStepper value={item.quantity} onChange={onCantidad} min={1} max={20} label={product.nombre} />
            )}
          </div>

          {/* Subtotal */}
          <span className="text-right font-display text-sm sm:text-xl font-extrabold text-brand-dark min-w-0 flex-1 px-1 sm:min-w-24">
            {formatearPrecio(item.unitPrice * item.quantity)}
          </span>

          {/* Botones de Editar y Basurero */}
          <div className="flex items-center shrink-0">
            {onEditar ? (
              <button type="button" onClick={onEditar} aria-label={`Editar ${product.nombre}`} className={`${botonIcono} hover:bg-brand-cream`}>
                <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
              </button> 
            ) : (
              <button type="button" onClick={() => {}} aria-label={`${product.nombre} no es editable`} className={`${botonIcono} !text-gray-400 opacity-50 cursor-not-allowed pointer-events-none`}>
                <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={quitar}
              aria-label={item.promoFija ? `Quitar la promo ${promo ?? ''}` : `Quitar ${product.nombre}`}
              title={item.promoFija ? 'Quita la promo completa' : undefined}
              className={`${botonIcono} hover:bg-brand-red/10 hover:text-brand-red`}
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

        </div>

      </div>
    </article>
  )
}

export default CartItemRow
