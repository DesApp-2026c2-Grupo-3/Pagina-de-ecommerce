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
  /** Opcional: permite ocultar la descripción para un diseño más limpio en listas apretadas */
  mostrarDescripcion?: boolean
}

export default function ProductCard({ 
  product, 
  indice, 
  compacta = false, 
  mostrarDescripcion = true 
}: ProductCardProps) {
  const isUnavailable = !product.disponible
  const tieneTamanios = (product.tamanios?.length ?? 0) > 0
  // Fondo de la foto intercalado entre mostaza y arena, como en el diseño
  const fondoFoto = (indice ?? product.id) % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'  
  // Si hoy está en promo (o es el producto de la semana), lleva una etiqueta
  const promo = promoDelProducto(usePromociones(), product.id)

  return (
    <Link to={`/producto/${product.id}`} className="group block h-full">
      <article
        className={`relative flex h-full overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] border-2 bg-white transition ${
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
                ? 'left-1.5 top-1.5 h-10 w-10 text-[10px] sm:left-auto sm:right-3 sm:top-3 sm:h-14 sm:w-14 sm:text-sm'
                : 'right-2 top-2 h-11 w-11 text-xs sm:right-3 sm:top-3 sm:h-14 sm:w-14 sm:text-sm'
            }`}
          >
            {promo.destacado}
            {promo.destacado.endsWith('%') && <span className="block text-[8px] sm:text-[10px]">OFF</span>}
          </span>
        )}

        {isUnavailable && (
          <span
            className={`absolute z-10 rounded-full bg-brand-dark font-bold text-white ${
              compacta ? 'left-1.5 top-1.5 px-2 py-0.5 text-[9px] sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs' : 'left-2 top-2 px-2 py-0.5 text-[10px] sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs'
            }`}
          >
            No disponible
          </span>
        )}

        <div
          className={`grid place-items-center ${
            compacta ? 'w-24 shrink-0 self-stretch sm:h-44 sm:w-auto sm:self-auto' : 'h-32 sm:h-44'
          } ${isUnavailable ? 'bg-brand-sand/60' : fondoFoto}`}
        >
          <ImagenProducto
            src={product.imagen}
            alt={product.nombre}
            ancho={compacta ? 400 : 600}
            className={`w-full object-contain drop-shadow-lg transition-transform duration-300 ${
              compacta ? 'h-20 sm:h-36' : 'h-24 sm:h-36'
            } ${
              isUnavailable ? 'opacity-50 grayscale' : 'group-hover:scale-110 group-hover:-rotate-3'
            }`}
            claseIcono={`text-brand-dark ${compacta ? 'h-10 w-10 sm:h-20 sm:w-20' : 'h-14 w-14 sm:h-20 sm:w-20'} ${isUnavailable ? 'opacity-40' : ''}`}
          />
        </div>

        {/* 🛠️ AJUSTE DE MARGENES: Reducimos el padding en móvil (p-3 sm:p-5) */}
        <div
          className={`flex min-w-0 flex-1 flex-col gap-0.5 border-brand-dark ${
            compacta ? 'border-l-2 p-3 sm:border-l-0 sm:border-t-2 sm:p-5' : 'border-t-2 p-3 sm:p-5'
          }`}
        >
          {/* 🛠️ TEXTO DE TÍTULO MÁS CHICO: Cambiamos de text-xl a text-sm de base en celular y text-xl en sm */}
          <h3 className={`font-display font-extrabold leading-tight text-brand-dark ${compacta ? 'text-sm sm:text-xl' : 'text-sm sm:text-xl'}`}>
            {product.nombre}
          </h3>

          {mostrarDescripcion && product.descripcion && (
            <p className="line-clamp-2 flex-1 text-xs text-brand-muted sm:text-sm">{product.descripcion}</p>
          )}

          <div className={`flex items-center justify-between ${compacta ? 'mt-2 sm:mt-3' : 'mt-2 sm:mt-3'} ${!mostrarDescripcion ? 'mt-auto' : ''}`}>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              {tieneTamanios && <span className="text-[10px] font-semibold text-brand-muted sm:text-xs">desde</span>}
              {/* 🛠️ PRECIO COMPACTADO: text-base en móvil escalando a sm:text-xl */}
              <span className={`font-extrabold ${compacta ? 'text-base sm:text-xl' : 'text-base sm:text-xl'} ${isUnavailable ? 'text-brand-muted' : 'text-brand-red'}`}>
                {formatearPrecio(precioDesde(product))}
              </span>
            </div>

            {!isUnavailable && (
              /* 🛠️ ICONO MAS CHICO EN SM: Bajamos de h-10 w-10 a h-8 w-8 de base en móviles */
              <span
                aria-hidden="true"
                className={`grid place-items-center rounded-xl bg-brand-red text-white transition-transform group-hover:rotate-90 ${
                  compacta ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-8 w-8 sm:h-10 sm:w-10'
                }`}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
