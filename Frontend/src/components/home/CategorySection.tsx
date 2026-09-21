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
    <section
      className="mx-auto max-w-7xl scroll-mt-32 px-4 py-8"
      id={`categoria-${categoryId}`}
    >
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-extrabold text-brand-dark">
        <span className="text-3xl">{icon}</span>
        {title}
      </h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-64 shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default CategorySection
