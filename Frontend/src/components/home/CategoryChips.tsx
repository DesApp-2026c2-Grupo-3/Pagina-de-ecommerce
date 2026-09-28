import type { Category } from '../../types/product'
import { useDragScroll } from '../../hooks/useDragScroll'

interface CategoryChipsProps {
  categories: Category[]
}

function CategoryChips({ categories }: CategoryChipsProps) {
  const { ref, handlers } = useDragScroll<HTMLDivElement>()

  function handleClick(id: number) {
    document
      .getElementById(`categoria-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-16 z-10 border-b border-brand-dark/10 bg-brand-cream/95 backdrop-blur">
      <div
        ref={ref}
        {...handlers}
        className={`-mx-4 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide md:mx-auto md:max-w-7xl ${handlers.className}`}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleClick(category.id)}
            className="shrink-0 rounded-full border border-brand-dark/20 bg-white px-4 py-2 text-sm font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red"
          >
             {category.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryChips
