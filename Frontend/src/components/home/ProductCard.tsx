import { Link } from 'react-router-dom'
import type { ProductoBackend } from '../../types/product'

interface ProductCardProps {
  product: ProductoBackend
}

export default function ProductCard({ product }: ProductCardProps) {
  const isUnavailable = !product.disponible
  const precios = product.tamanios?.map((v) => Number(v.precio)) ?? []
  const tieneTamanios = precios.length > 0
  const precioMostrado = tieneTamanios ? Math.min(...precios) : Number(product.precio)

  return (
    <Link to={`/producto/${product.id}`} className="block h-full">
      <article
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-transform ${
          isUnavailable ? '' : 'hover:scale-105 hover:shadow-xl'
        }`}
      >
        {isUnavailable && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-dark px-3 py-1 text-xs font-bold text-white shadow">
            No disponible
          </span>
        )}

        {product.imagen ? (
          <img
            src={product.imagen}
            alt={product.nombre}
            className={`h-40 w-full object-contain object-center
              bg-gradient-to-t from-orange-400 to-orange-100 ${
              isUnavailable ? 'opacity-50 grayscale' : ''
            }`}
          />
        ) : (
          <div
            className={`grid h-40 w-full place-items-center bg-brand-cream text-5xl ${
              isUnavailable ? 'opacity-50 grayscale' : ''
            }`}
            aria-hidden="true"
          >
            🍽️
          </div>
        )}

        <div className="flex flex-1 flex-col p-4 border-t-2
        bg-gradient-to-t from-stone-300 to-stone-100">
          <h3 className="text-lg font-bold text-brand-dark">
            {product.nombre}
          </h3>

          <p className="mt-1 flex-1 text-sm text-gray-600 line-clamp-2">
            {product.descripcion}
          </p>

          <div className="mt-4 flex items-baseline gap-1">            {tieneTamanios && <span className="text-xs font-semibold text-gray-500">desde</span>}
            <span className={`text-xl font-extrabold ${isUnavailable ? 'text-gray-400' : 'text-brand-red'}`}>
              ${precioMostrado.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
