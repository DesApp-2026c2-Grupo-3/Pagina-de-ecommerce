import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ImagenProducto from '../ui/ImagenProducto'
import { formatearPrecio, precioDesde } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'
import { usePromociones } from '../../hooks/usePromociones'
import { promoDelProducto } from '../../utils/promosUtils'

export type VistaProducto = 'lista' | 'cuadricula' | 'mosaico'

interface ProductCardProps {
  product: ProductoBackend
  indice?: number
  compacta?: boolean
  mostrarDescripcion?: boolean
  /** Activa formato horizontal 50/50 estilo PromoBanner entre 405px y 639px */
  horizontalIntermedio?: boolean
  /** Control explícito de layout para el catálogo (lista, cuadrícula completa o mosaico sin descripción) */
  vista?: VistaProducto
}

const STYLES = {
  link: 'group block h-full',
  articleBase: 'relative flex h-full overflow-hidden rounded-[1.5rem] border-2 bg-white transition sm:rounded-[1.75rem]',
  articleAvailable: 'border-brand-dark group-hover:-translate-y-1 group-hover:shadow-sticker',
  articleUnavailable: 'border-dashed border-brand-muted/60',
  articleHorizontalMid: 'min-[405px]:max-[639px]:grid min-[405px]:max-[639px]:grid-cols-2',
  promoBadgeBase:
    'absolute z-10 grid rotate-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-red text-center font-display font-extrabold leading-none text-white',
  promoBadgeCompact: 'left-1.5 top-1.5 h-10 w-10 text-[10px] sm:left-auto sm:right-3 sm:top-3 sm:h-14 sm:w-14 sm:text-sm',
  promoBadgeLista: 'left-1.5 top-1.5 h-10 w-10 text-[10px] sm:h-11 sm:w-11 sm:text-xs',
  promoBadgeMosaico: 'right-2 top-2 h-9 w-9 text-[10px] sm:h-11 sm:w-11 sm:text-xs',
  promoBadgeDefault: 'right-2 top-2 h-11 w-11 text-xs sm:right-3 sm:top-3 sm:h-14 sm:w-14 sm:text-sm',
  unavailableBadgeBase: 'absolute z-10 rounded-full bg-brand-dark font-bold text-white',
  unavailableBadgeCompact: 'left-1.5 top-1.5 px-2 py-0.5 text-[9px] sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs',
  unavailableBadgeLista: 'left-1.5 top-1.5 px-2 py-0.5 text-[9px]',
  unavailableBadgeDefault: 'left-2 top-2 px-2 py-0.5 text-[10px] sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs',
  mediaWrapperBase: 'grid place-items-center',
  mediaWrapperCompact: 'w-24 shrink-0 self-stretch sm:h-44 sm:w-auto sm:self-auto',
  mediaWrapperLista: 'w-24 shrink-0 self-stretch sm:w-32',
  mediaWrapperMosaico: 'h-28 sm:h-36',
  mediaWrapperDefault: 'h-32 sm:h-44',
  mediaWrapperHorizontalMid: 'min-[405px]:max-[639px]:h-full min-[405px]:max-[639px]:min-h-44 min-[405px]:max-[639px]:p-3',
  imageBase: 'w-full object-contain drop-shadow-lg transition-transform duration-300',
  imageAvailable: 'group-hover:scale-110 group-hover:-rotate-3',
  imageUnavailable: 'opacity-50 grayscale',
  imageHorizontalMid: 'min-[405px]:max-[639px]:h-36',
  bodyBase: 'flex min-w-0 flex-1 flex-col justify-between gap-1 border-brand-dark',
  bodyCompact: 'border-l-2 p-3 sm:border-l-0 sm:border-t-2 sm:p-5',
  bodyLista: 'border-l-2 p-3 sm:p-4',
  bodyMosaico: 'border-t-2 p-2.5 sm:p-3.5',
  bodyDefault: 'border-t-2 p-3 sm:p-5',
  bodyHorizontalMid:
    'min-[405px]:max-[639px]:justify-between min-[405px]:max-[639px]:border-l-2 min-[405px]:max-[639px]:border-t-0 min-[405px]:max-[639px]:p-4',
  title: 'font-display text-sm font-extrabold leading-tight text-brand-dark sm:text-xl',
  titleMosaico: 'line-clamp-2 font-display text-xs font-extrabold leading-tight text-brand-dark sm:text-base',
  titleHorizontalMid: 'min-[405px]:max-[639px]:text-lg',
  descriptionVisible: 'line-clamp-2 flex-1 text-xs text-brand-muted sm:text-sm',
  descriptionDesktopOnly: 'hidden text-xs text-brand-muted sm:line-clamp-2 sm:flex-1 sm:text-sm',
  descriptionHorizontalMid: 'min-[405px]:max-[639px]:mt-1 min-[405px]:max-[639px]:line-clamp-2 min-[405px]:max-[639px]:block',
  footerBase: 'mt-2 flex items-center justify-between sm:mt-3',
  footerMosaico: 'mt-1.5 flex items-center justify-between',
  priceGroup: 'flex items-baseline gap-0.5 sm:gap-1',
  priceFrom: 'text-[10px] font-semibold text-brand-muted sm:text-xs',
  priceText: 'text-base font-extrabold sm:text-xl',
  priceMosaico: 'text-sm font-extrabold sm:text-base',
  priceHorizontalMid: 'min-[405px]:max-[639px]:text-lg',
  addBtn:
    'grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-red text-white transition-transform group-hover:rotate-90 sm:h-10 sm:w-10',
  addBtnMosaico:
    'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-red text-white transition-transform group-hover:rotate-90 sm:h-8 sm:w-8 sm:rounded-xl',
  addIcon: 'h-4 w-4 sm:h-5 sm:w-5',
  addIconMosaico: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
} as const

export default function ProductCard({
  product,
  indice,
  compacta = false,
  mostrarDescripcion = true,
  horizontalIntermedio = false,
  vista,
}: ProductCardProps) {
  const isUnavailable = !product.disponible
  const tieneTamanios = (product.tamanios?.length ?? 0) > 0
  const fondoFoto = (indice ?? product.id) % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'
  const promo = promoDelProducto(usePromociones(), product.id)

  const esLista = vista === 'lista'
  const esMosaico = vista === 'mosaico'
  const mostrarDesc = esMosaico ? false : mostrarDescripcion

  const articleDirection = vista ? (esLista ? 'flex-row' : 'flex-col') : compacta ? 'flex-row sm:flex-col' : 'flex-col'

  const promoBadgeClass =
    vista === 'lista'
      ? STYLES.promoBadgeLista
      : vista === 'mosaico'
        ? STYLES.promoBadgeMosaico
        : compacta
          ? STYLES.promoBadgeCompact
          : STYLES.promoBadgeDefault

  const unavailableBadgeClass =
    vista === 'lista'
      ? STYLES.unavailableBadgeLista
      : compacta
        ? STYLES.unavailableBadgeCompact
        : STYLES.unavailableBadgeDefault

  const mediaWrapperClass =
    vista === 'lista'
      ? STYLES.mediaWrapperLista
      : vista === 'mosaico'
        ? STYLES.mediaWrapperMosaico
        : compacta
          ? STYLES.mediaWrapperCompact
          : STYLES.mediaWrapperDefault

  const imageHeightClass =
    vista === 'lista'
      ? 'h-20 sm:h-24'
      : vista === 'mosaico'
        ? 'h-22 sm:h-28'
        : compacta
          ? 'h-20 sm:h-36'
          : 'h-30 sm:h-36'

  const bodyClass =
    vista === 'lista'
      ? STYLES.bodyLista
      : vista === 'mosaico'
        ? STYLES.bodyMosaico
        : compacta
          ? STYLES.bodyCompact
          : STYLES.bodyDefault

  return (
    <Link to={`/producto/${product.id}`} className={STYLES.link}>
      <article
        className={`${STYLES.articleBase} ${articleDirection} ${
          horizontalIntermedio ? STYLES.articleHorizontalMid : ''
        } ${isUnavailable ? STYLES.articleUnavailable : STYLES.articleAvailable}`}
      >
        {promo && !isUnavailable && (
          <span className={`${STYLES.promoBadgeBase} ${promoBadgeClass}`}>
            {promo.destacado}
            {promo.destacado.endsWith('%') && <span className="block text-[8px] sm:text-[10px]">OFF</span>}
          </span>
        )}

        {isUnavailable && (
          <span className={`${STYLES.unavailableBadgeBase} ${unavailableBadgeClass}`}>No disponible</span>
        )}

        <div
          className={`${STYLES.mediaWrapperBase} ${mediaWrapperClass} ${
            horizontalIntermedio ? STYLES.mediaWrapperHorizontalMid : ''
          } ${isUnavailable ? 'bg-brand-sand/60' : fondoFoto}`}
        >
          <ImagenProducto
            src={product.imagen}
            alt={product.nombre}
            ancho={esLista || esMosaico || compacta ? 400 : 600}
            className={`${STYLES.imageBase} ${imageHeightClass} ${
              horizontalIntermedio ? STYLES.imageHorizontalMid : ''
            } ${isUnavailable ? STYLES.imageUnavailable : STYLES.imageAvailable}`}
            claseIcono={`text-brand-dark ${
              esLista || esMosaico ? 'h-10 w-10' : compacta ? 'h-10 w-10 sm:h-20 sm:w-20' : 'h-14 w-14 sm:h-20 sm:w-20'
            } ${isUnavailable ? 'opacity-40' : ''}`}
          />
        </div>

        <div
          className={`${STYLES.bodyBase} ${bodyClass} ${
            horizontalIntermedio ? STYLES.bodyHorizontalMid : ''
          }`}
        >
          <div>
            <h3
              className={`${esMosaico ? STYLES.titleMosaico : STYLES.title} ${
                horizontalIntermedio ? STYLES.titleHorizontalMid : ''
              }`}
            >
              {product.nombre}
            </h3>

            {!esMosaico && product.descripcion && (
              <p
                className={`${mostrarDesc ? STYLES.descriptionVisible : STYLES.descriptionDesktopOnly} ${
                  horizontalIntermedio ? STYLES.descriptionHorizontalMid : ''
                }`}
              >
                {product.descripcion}
              </p>
            )}
          </div>

          <div className={`${esMosaico ? STYLES.footerMosaico : STYLES.footerBase} ${!mostrarDesc ? 'mt-auto' : ''}`}>
            <div className={STYLES.priceGroup}>
              {tieneTamanios && <span className={STYLES.priceFrom}>desde</span>}
              <span
                className={`${esMosaico ? STYLES.priceMosaico : STYLES.priceText} ${
                  horizontalIntermedio ? STYLES.priceHorizontalMid : ''
                } ${isUnavailable ? 'text-brand-muted' : 'text-brand-red'}`}
              >
                {formatearPrecio(precioDesde(product))}
              </span>
            </div>

            {!isUnavailable && (
              <span aria-hidden="true" className={esMosaico ? STYLES.addBtnMosaico : STYLES.addBtn}>
                <Plus className={esMosaico ? STYLES.addIconMosaico : STYLES.addIcon} strokeWidth={3} />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
