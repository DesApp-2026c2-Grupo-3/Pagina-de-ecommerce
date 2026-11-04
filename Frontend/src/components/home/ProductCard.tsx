import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ImagenProducto from '../ui/ImagenProducto'
import { formatearPrecio, precioDesde } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'
import { usePromociones } from '../../hooks/usePromociones'
import { promoDelProducto } from '../../utils/promosUtils'

interface ProductCardProps {
  product: ProductoBackend
  indice?: number
  /**
   * En celular (menos de 640 px) la card es una fila horizontal: foto chica a la izquierda y los datos a la derecha,
   * para que entren varios productos por pantalla. Desde tablet es la card vertical de siempre.
   */
  compacta?: boolean
}

export default function ProductCard({ product, indice, compacta = false }: ProductCardProps) {
  const isUnavailable = !product.disponible
  const tieneTamanios = (product.tamanios?.length ?? 0) > 0
  // Fondo de la foto intercalado entre mostaza y arena, como en el diseño
  const fondoFoto = (indice ?? product.id) % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'  
  // Si hoy está en promo (o es el producto de la semana), lleva una etiqueta
  const promo = promoDelProducto(usePromociones(), product.id)

  return (
    <Link to={`/producto/${product.id}`} className="group block h-full">
      <article
        className={`relative flex h-full overflow-hidden rounded-[1.75rem] border-2 bg-white transition ${
          compacta ? 'flex-row sm:flex-col' : 'flex-col'
        } ${
          isUnavailable
            ? 'border-dashed border-brand-muted/60'
            : 'border-brand-dark group-hover:-translate-y-1 group-hover:shadow-sticker'
        }`}
      >
        {promo && !isUnavailable && (
          <span
            className={`absolute z-10 grid rotate-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-red text-center font-display font-extrabold leading-none text-white ${
              compacta
                ? 'left-1.5 top-1.5 h-11 w-11 text-xs sm:left-auto sm:right-3 sm:top-3 sm:h-14 sm:w-14 sm:text-sm'
                : 'right-3 top-3 h-14 w-14 text-sm'
            }`}
          >
            {promo.destacado}
            {promo.destacado.endsWith('%') && <span className="block text-[10px]">OFF</span>}
          </span>
        )}

        {isUnavailable && (
          <span
            className={`absolute z-10 rounded-full bg-brand-dark font-bold text-white ${
              compacta ? 'left-1.5 top-1.5 px-2 py-0.5 text-[10px] sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs' : 'left-3 top-3 px-3 py-1 text-xs'
            }`}
          >
            No disponible
          </span>
        )}

        <div
          className={`grid place-items-center ${
            compacta ? 'w-28 shrink-0 self-stretch sm:h-44 sm:w-auto sm:self-auto' : 'h-44'
          } ${isUnavailable ? 'bg-brand-sand/60' : fondoFoto}`}
        >
          <ImagenProducto
            src={product.imagen}
            alt={product.nombre}
            ancho={compacta ? 400 : 600}
            className={`w-full object-contain drop-shadow-lg transition-transform duration-300 ${
              compacta ? 'h-24 sm:h-36' : 'h-36'
            } ${
              isUnavailable ? 'opacity-50 grayscale' : 'group-hover:scale-110 group-hover:-rotate-3'
            }`}
            claseIcono={`text-brand-dark ${compacta ? 'h-12 w-12 sm:h-20 sm:w-20' : 'h-20 w-20'} ${isUnavailable ? 'opacity-40' : ''}`}
          />
        </div>

        <div
          className={`flex min-w-0 flex-1 flex-col gap-1 border-brand-dark ${
            compacta ? 'border-l-2 p-3 sm:border-l-0 sm:border-t-2 sm:p-5' : 'border-t-2 p-5'
          }`}
        >
          <h3 className={`font-display font-extrabold leading-tight text-brand-dark ${compacta ? 'text-base sm:text-xl' : 'text-xl'}`}>
            {product.nombre}
          </h3>

          <p className="line-clamp-2 flex-1 text-sm text-brand-muted">{product.descripcion}</p>

          <div className={`flex items-center justify-between ${compacta ? 'mt-2 sm:mt-3' : 'mt-3'}`}>
            <div className="flex items-baseline gap-1">
              {tieneTamanios && <span className="text-xs font-semibold text-brand-muted">desde</span>}
              <span className={`font-extrabold ${compacta ? 'text-lg sm:text-xl' : 'text-xl'} ${isUnavailable ? 'text-brand-muted' : 'text-brand-red'}`}>
                {formatearPrecio(precioDesde(product))}
              </span>
            </div>

            {!isUnavailable && (
              <span
                aria-hidden="true"
                className={`grid place-items-center rounded-xl bg-brand-red text-white transition-transform group-hover:rotate-90 ${
                  compacta ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-10 w-10'
                }`}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}