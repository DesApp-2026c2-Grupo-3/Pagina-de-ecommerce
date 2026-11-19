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
// < 480px: fila dentro de la lista unificada | >= 480px: tarjeta individual
const tarjetaFilaClase =
  'grid w-full grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1.5 px-2.5 py-2.5 min-[380px]:gap-x-3 min-[380px]:px-3 min-[480px]:rounded-3xl min-[480px]:border-2 min-[480px]:border-brand-dark min-[480px]:bg-white sm:gap-x-4 sm:px-4 sm:py-3'

// Separador ornamental con 3 rombitos entre ítems (< 480px)
const separadorOrnamentalClase =
  'ornamento-item col-span-2 -mt-2.5 mb-2 hidden items-center gap-2 px-1'
const lineaOrnamentalClase = 'h-px flex-1 border-t-2 border-dashed border-brand-sand'
const romboChicoClase =
  'h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1.5px] border border-brand-dark bg-brand-cream'
const romboCentralClase =
  'h-2 w-2 shrink-0 rotate-45 rounded-[2px] border border-brand-dark bg-brand-mustard'

const cajaImagenBaseClase =
  'grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-brand-dark/10 shadow-sm min-[380px]:row-span-2 min-[380px]:h-20 min-[380px]:w-20'
const imgProductoClase = 'h-11 w-11 object-contain min-[380px]:h-16 min-[380px]:w-16'

const bloqueSobreLineaClase = 'flex min-w-0 items-start justify-between gap-1 sm:gap-3'

const badgePromoClase =
  'mb-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-extrabold text-white min-[480px]:text-xs'
const tituloProductoClase =
  'truncate font-display text-sm font-extrabold leading-tight text-brand-dark min-[480px]:text-lg'
const detalleOpcionesClase =
  'mt-0.5 truncate text-[11px] leading-tight text-brand-muted min-[480px]:text-sm'
const precioUnitarioClase =
  'text-[11px] font-bold leading-none text-brand-muted min-[380px]:text-xs min-[480px]:text-sm'

// Sin línea punteada interna en < 480px (modo lista); recupera la línea punteada desde 480px (tarjetas)
const bloqueBajoLineaClase =
  'col-span-2 flex items-center justify-between gap-2 pt-1 min-[380px]:col-span-1 min-[480px]:border-t-2 min-[480px]:border-dashed min-[480px]:border-brand-dark/15 min-[480px]:pt-1.5 sm:items-baseline'
const subtotalAbajoDerechaClase =
  'shrink-0 text-right font-display text-base font-extrabold tabular-nums leading-none text-brand-dark min-[480px]:text-xl'

const botonIconoChicoClase =
  'grid h-7 w-7 place-items-center rounded-xl text-brand-dark transition-colors min-[380px]:h-8 min-[380px]:w-8 sm:h-9 sm:w-9'
const botonEditarDeshabilitadoClase =
  'grid h-7 w-7 cursor-not-allowed place-items-center rounded-xl text-brand-muted/40 min-[380px]:h-8 min-[380px]:w-8 sm:h-9 sm:w-9'

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

  const descripcionItem = detalle || 'Regular'
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
          <Pencil className="h-3.5 w-3.5 min-[380px]:h-4 min-[380px]:w-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled
          aria-label={`${product.nombre} no es editable`}
          className={botonEditarDeshabilitadoClase}
        >
          <Pencil className="h-3.5 w-3.5 min-[380px]:h-4 min-[380px]:w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={quitar}
        aria-label={item.promoFija ? `Quitar la promo ${promo ?? ''}` : `Quitar ${product.nombre}`}
        title={item.promoFija ? 'Quita la promo completa' : `Quitar ${product.nombre}`}
        className={`${botonIconoChicoClase} hover:bg-brand-red/10 hover:text-brand-red`}
      >
        <Trash2 className="h-3.5 w-3.5 min-[380px]:h-4 min-[380px]:w-4" />
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
      {/* Separador ornamental con 3 rombitos entre ítems (< 480px) */}
      <div className={separadorOrnamentalClase} aria-hidden="true">
        <span className={lineaOrnamentalClase} />
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={romboChicoClase} />
          <span className={romboCentralClase} />
          <span className={romboChicoClase} />
        </div>
        <span className={lineaOrnamentalClase} />
      </div>

      {/* Foto a la izquierda */}
      <div className={`${cajaImagenBaseClase} ${product.id % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'}`}>
        {product.imagen && !imagenRota ? (
          <img
            src={product.imagen}
            alt={product.nombre}
            onError={() => setImagenRota(true)}
            className={imgProductoClase}
          />
        ) : (
          <CategoryIcon icono="generico" className="h-8 w-8 min-[380px]:h-10 min-[380px]:w-10" />
        )}
      </div>

      {/* Bloque superior derecho: Título/detalle + Acciones */}
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

          <p className={detalleOpcionesClase}>{descripcionItem}</p>

          <div className="mt-1 sm:hidden">{precioUnitarioTexto}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">{controlCantidad}</div>
          {botonesAccion}
        </div>
      </div>

      {/* Stepper + Precio total en la esquina derecha (sin línea punteada en < 480px) */}
      <div className={bloqueBajoLineaClase}>
        <div className="sm:hidden">{controlCantidad}</div>
        <div className="hidden min-w-0 sm:block">{precioUnitarioTexto}</div>

        <span className={subtotalAbajoDerechaClase}>{subtotalItem}</span>
      </div>
    </article>
  )
}

export default CartItemRow
