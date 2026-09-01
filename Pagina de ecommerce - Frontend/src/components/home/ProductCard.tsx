import type { Product } from '../../types/product'

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <a href={`/producto/${product.id}`} className="block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl">
        <img
          src={product.image}
          alt={product.name}
          className="h-40 w-full bg-brand-cream object-cover"
        />
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-bold text-brand-dark">{product.name}</h3>
          <p className="mt-1 flex-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xl font-extrabold text-brand-red">
              ${product.price.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </article>
    </a>
  )
}

export default ProductCard
