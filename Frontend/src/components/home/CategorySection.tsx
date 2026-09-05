import type { Product } from '../../types/product'
import ProductCard from './ProductCard'

interface CategorySectionProps {
  categoryId: number
  title: string
  icon: string
  products: Product[]
}

function CategorySection({ categoryId, title, icon, products }: CategorySectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8" id={`categoria-${categoryId}`}>
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-brand-dark">
        <span className="text-3xl">{icon}</span>
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default CategorySection
