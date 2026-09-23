import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  const isUnavailable = !product.available

  return (
    <Link to={`/producto/${product.id}`} className="block h-full">
      <article
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-transform ${
          isUnavailable ? '' : 'hover:-translate-y-1 hover:shadow-xl'
        }`}
      >
        {isUnavailable && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-dark px-3 py-1 text-xs font-bold text-white shadow">
            No disponible
          </span>
        )}
        {product.discountLabel && (
          <span
            className={`absolute right-3 top-3 z-10 grid h-14 w-14 -rotate-12 place-items-center rounded-full p-1 text-center text-xs font-extrabold leading-none text-white shadow-lg ${
              isUnavailable ? 'bg-gray-400' : 'bg-brand-green'
            }`}
            aria-label={`Promoción: ${product.discountLabel}`}
          >
            {product.discountLabel}
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          className={`h-40 w-full bg-brand-cream object-contain object-center ${
            isUnavailable ? 'opacity-50 grayscale' : ''
          }`}
        />
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-bold text-brand-dark">{product.name}</h3>
          <p className="mt-1 flex-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-extrabold ${
                  isUnavailable ? 'text-gray-400' : 'text-brand-red'
                }`}
              >
                ${product.price.toLocaleString('es-AR')}
              </span>
              {product.originalPrice && (
                <span className="text-sm font-semibold text-gray-400 line-through">
                  ${product.originalPrice.toLocaleString('es-AR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default ProductCard