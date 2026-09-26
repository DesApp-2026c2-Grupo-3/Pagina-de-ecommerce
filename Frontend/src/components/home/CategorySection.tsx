import type { ProductoBackend } from '../../types/product'
import ProductCard from './ProductCard'
import { useDragScroll } from '../../hooks/useDragScroll'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CategorySectionProps {
  categoryId: number
  title: string
  products: ProductoBackend[]
}

function CategorySection({ categoryId, title, products }: CategorySectionProps) {
  const { ref, handlers } = useDragScroll<HTMLDivElement>()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

function updateArrows() {
  const el = ref.current
  if (!el) return
  setCanScrollLeft(el.scrollLeft > 0)
  setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
}

useEffect(() => {
  updateArrows()
  window.addEventListener('resize', updateArrows)
  return () => window.removeEventListener('resize', updateArrows)
}, [products])

function scrollByPage(direction: 1 | -1) {
  ref.current?.scrollBy({
    left: direction * ref.current.clientWidth * 0.8,
    behavior: 'smooth',
  })
}
  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-32 px-4 py-8"
      id={`categoria-${categoryId}`}
    >
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-extrabold text-brand-dark">
        {title}
      </h2>

      <div className="relative">
        <div
          ref={ref}
          {...handlers}
          className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide ${handlers.className}`}>
          {products.map((product) => (
            <div key={product.id} className="w-64 shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}

          {canScrollLeft && (
            <button
            type="button"
            aria-label="Ver productos anteriores"
            onClick={() => scrollByPage(-1)}
            className="absolute left-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-dark shadow-lg transition-colors hover:bg-brand-red hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            )
          }

          {canScrollRight && (
            <button
            type="button"
            aria-label="Ver más productos"
            onClick={() => scrollByPage(1)}
            className="absolute right-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-dark shadow-lg transition-colors hover:bg-brand-red hover:text-white">
              <ChevronRight className="h-6 w-6" />
            </button>
          )
        }
    </div>
  </div>

  </section>
  )
}

export default CategorySection
