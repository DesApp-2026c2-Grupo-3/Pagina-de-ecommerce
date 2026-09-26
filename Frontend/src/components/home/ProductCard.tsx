import { Link } from 'react-router-dom'
import type { ProductoBackend } from '../../types/product'

interface ProductCardProps {
  product: ProductoBackend
}

export default function ProductCard({ product }: ProductCardProps) {
  const isUnavailable = !product.disponible

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

        <img
          src={product.imagen}
          alt={product.nombre}
          className={`h-40 w-full bg-brand-cream object-contain object-center ${
            isUnavailable ? 'opacity-50 grayscale' : ''
          }`}
        />

        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-bold text-brand-dark">
            {product.nombre}
          </h3>

          <p className="mt-1 flex-1 text-sm text-gray-600 line-clamp-2">
            {product.descripcion}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span
              className={`text-xl font-extrabold ${
                isUnavailable ? 'text-gray-400' : 'text-brand-red'
              }`}
            >
              ${Number(product.precio).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
