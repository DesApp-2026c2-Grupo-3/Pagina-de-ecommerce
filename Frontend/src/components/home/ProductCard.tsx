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
}

export default function ProductCard({ product, indice }: ProductCardProps) {
  const isUnavailable = !product.disponible
  const tieneTamanios = (product.tamanios?.length ?? 0) > 0
  // Fondo de la foto intercalado entre mostaza y arena, como en el diseño
  const fondoFoto = (indice ?? product.id) % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-sand'  
  // Si hoy está en promo (o es el producto de la semana), lleva una etiqueta
  const promo = promoDelProducto(usePromociones(), product.id)

  return (
    <Link to={`/producto/${product.id}`} className="group block h-full">
      <article
        className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border-2 bg-white transition ${
          isUnavailable
            ? 'border-dashed border-brand-muted/60'
            : 'border-brand-dark group-hover:-translate-y-1 group-hover:shadow-sticker'
        }`}
      >
        {promo && !isUnavailable && (
          <span className="absolute right-3 top-3 z-10 grid h-14 w-14 rotate-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-red text-center font-display text-sm font-extrabold leading-none text-white">
            {promo.destacado}
            {promo.destacado.endsWith('%') && <span className="block text-[10px]">OFF</span>}
          </span>
        )}

        {isUnavailable && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-dark px-3 py-1 text-xs font-bold text-white">
            No disponible
          </span>
        )}

        <div className={`grid h-44 place-items-center ${isUnavailable ? 'bg-brand-sand/60' : fondoFoto}`}>
          <ImagenProducto
            src={product.imagen}
            alt={product.nombre}
            className={`h-36 w-full object-contain drop-shadow-lg transition-transform duration-300 ${
              isUnavailable ? 'opacity-50 grayscale' : 'group-hover:scale-110 group-hover:-rotate-3'
            }`}
            claseIcono={`h-20 w-20 text-brand-dark ${isUnavailable ? 'opacity-40' : ''}`}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1 border-t-2 border-brand-dark p-5">
          <h3 className="font-display text-xl font-extrabold leading-tight text-brand-dark">{product.nombre}</h3>

          <p className="line-clamp-2 flex-1 text-sm text-brand-muted">{product.descripcion}</p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              {tieneTamanios && <span className="text-xs font-semibold text-brand-muted">desde</span>}
              <span className={`text-xl font-extrabold ${isUnavailable ? 'text-brand-muted' : 'text-brand-red'}`}>
                {formatearPrecio(precioDesde(product))}
              </span>
            </div>

            {!isUnavailable && (
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red text-white transition-transform group-hover:rotate-90"
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