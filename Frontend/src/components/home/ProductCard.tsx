import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/producto/${product.id}`} className="block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl">
        {product.discountLabel && (
          <span
            className="absolute right-3 top-3 z-10 grid h-14 w-14 -rotate-12 place-items-center rounded-full bg-brand-green p-1 text-center text-xs font-extrabold leading-none text-white shadow-lg"
            aria-label={`Promoción: ${product.discountLabel}`}
          >
            {product.discountLabel}
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="h-40 w-full bg-brand-cream object-cover"
        />
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-bold text-brand-dark">{product.name}</h3>
          <p className="mt-1 flex-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-brand-red">
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
