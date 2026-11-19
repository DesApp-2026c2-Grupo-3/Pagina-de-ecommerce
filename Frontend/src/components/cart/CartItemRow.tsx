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

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const tarjetaFilaClase =
  'flex w-full items-start gap-2.5 rounded-3xl border-2 border-brand-dark bg-white px-3 py-2.5 min-[380px]:gap-3 min-[480px]:gap-4 min-[480px]:px-4 min-[480px]:py-3'

const cajaImagenBaseClase =
  'grid h-16 w-16 shrink-0 self-start place-items-center rounded-2xl border border-brand-dark/10 shadow-sm min-[380px]:h-20 min-[380px]:w-20'
const imgProductoClase =
  'h-13 w-13 object-contain min-[380px]:h-16 min-[380px]:w-16'

const bloqueSobreLineaClase = 'flex items-start justify-between gap-2 sm:gap-3'

const badgePromoClase =
  'mb-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-extrabold text-white min-[480px]:text-xs'
const tituloProductoClase =
  'truncate font-display text-sm font-extrabold leading-none text-brand-dark min-[480px]:text-lg'
const detalleOpcionesClase =
  'mt-1 truncate text-[11px] leading-tight text-brand-muted min-[480px]:text-sm'
const precioUnitarioClase =
  'text-xs font-bold leading-none text-brand-muted min-[480px]:text-sm'

const bloqueBajoLineaClase =
  'mt-1.5 flex items-center justify-between gap-2 border-t-2 border-dashed border-brand-dark/15 pt-1.5 sm:items-baseline'
const subtotalAbajoDerechaClase =
  'shrink-0 text-right font-display text-base font-extrabold tabular-nums leading-none text-brand-dark min-[480px]:text-xl'

const botonIconoChicoClase =
  'grid h-8 w-8 place-items-center rounded-xl text-brand-dark transition-colors sm:h-9 sm:w-9'
const botonEditarDeshabilitadoClase =
  'grid h-8 w-8 cursor-not-allowed place-items-center rounded-xl text-brand-muted/40 sm:h-9 sm:w-9'

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
  const subtotalItem = formatearPrecio(item.unitPrice * item.quantity)

  const quitar = () => (item.promoFija && item.promoId ? removePromo(item.promoId) : onQuitar())

  const controlCantidad = item.promoFija ? (
    <span className="inline-block rounded-full bg-brand-cream px-3 py-1 text-xs font-bold text-brand-dark">
      × {item.quantity}
    </span>
  ) : (
    <QuantityStepper
      value={item.quantity}
      onChange={onCantidad}
      min={1}
      max={20}
      label={product.nombre}
      compacto
      sinBorde
    />
  )

  const botonesAccion = (
    <div className="flex shrink-0 items-center gap-0.5">
      {onEditar ? (
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${product.nombre}`}
          title={`Editar ${product.nombre}`}
          className={`${botonIconoChicoClase} hover:bg-brand-cream`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled
          aria-label={`${product.nombre} no es editable`}
          className={botonEditarDeshabilitadoClase}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={quitar}
        aria-label={item.promoFija ? `Quitar la promo ${promo ?? ''}` : `Quitar ${product.nombre}`}
        title={item.promoFija ? 'Quita la promo completa' : `Quitar ${product.nombre}`}
        className={`${botonIconoChicoClase} hover:bg-brand-red/10 hover:text-brand-red`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  const precioUnitarioTexto = (
    <p className={precioUnitarioClase}>
      {conDescuento && <s className="mr-1.5 font-semibold">{formatearPrecio(item.precioLista!)}</s>}
      {item.unitPrice === 0 ? 'Gratis' : `${formatearPrecio(item.unitPrice)} c/u`}
    </p>
  )

  return (
    <article className={tarjetaFilaClase}>
      {/* Foto a la izquierda alineada al borde superior del título */}
      <div className={`${cajaImagenBaseClase} ${product.id % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'}`}>
        {product.imagen && !imagenRota ? (
          <img
            src={product.imagen}
            alt={product.nombre}
            onError={() => setImagenRota(true)}
            className={imgProductoClase}
          />
        ) : (
          <CategoryIcon icono="generico" className="h-9 w-9 sm:h-10 sm:w-10" />
        )}
      </div>

      {/* Columna derecha */}
      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
        {/* Arriba de la línea punteada */}
        <div className={bloqueSobreLineaClase}>
          <div className="min-w-0 flex-1">
            {promo && (
              <span className={badgePromoClase}>
                <Tag className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">
                  {promo}
                  {item.descuento ? ` · ${etiquetaDescuento(item.descuento)}` : ''}
                </span>
              </span>
            )}

            <h3 className={tituloProductoClase}>{product.nombre}</h3>

            {detalle && <p className={detalleOpcionesClase}>{detalle}</p>}

            {/* En < 640px (incluye 480px - 639px), el precio unitario va arriba debajo del detalle */}
            <div className="mt-1 sm:hidden">{precioUnitarioTexto}</div>
          </div>

          {/* En < 640px: lápiz/tacho arriba a la derecha (justo encima del precio). En >= 640px: stepper + lápiz/tacho */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">{controlCantidad}</div>
            {botonesAccion}
          </div>
        </div>

        {/* Debajo de la línea punteada */}
        <div className={bloqueBajoLineaClase}>
          {/* Izquierda: Stepper en < 640px | Precio unitario en >= 640px */}
          <div className="sm:hidden">{controlCantidad}</div>
          <div className="hidden min-w-0 sm:block">{precioUnitarioTexto}</div>

          {/* Derecha: Precio final (justo debajo del lápiz y el tacho en 480px - 639px) */}
          <span className={subtotalAbajoDerechaClase}>{subtotalItem}</span>
        </div>
      </div>
    </article>
  )
}

export default CartItemRow
