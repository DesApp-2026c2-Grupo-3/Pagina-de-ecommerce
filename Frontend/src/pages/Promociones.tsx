import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/home/ProductCard'
import { getPromoCategories, getPromotions } from '../services/promotionService'
import type { Category, Product } from '../types/product'

const ALL_TAB = 'Todas'

function Promociones() {
  const [promotions, setPromotions] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_TAB)

  useEffect(() => {
    getPromotions().then(setPromotions)
    getPromoCategories().then(setCategories)
  }, [])

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      if (!promo.available) return false
      if (selectedCategory !== ALL_TAB && promo.category !== selectedCategory) return false
      return true
    })
  }, [promotions, selectedCategory])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-brand-dark sm:text-4xl">Promociones</h1>
      <p className="mt-2 text-gray-600">Aprovechá nuestros combos y descuentos de la semana.</p>

      <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0 md:pb-0">
        <button
          type="button"
          onClick={() => setSelectedCategory(ALL_TAB)}
          aria-pressed={selectedCategory === ALL_TAB}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
            selectedCategory === ALL_TAB
              ? 'border-brand-red bg-brand-red text-white'
              : 'border-brand-dark/20 bg-white text-brand-dark hover:border-brand-red hover:text-brand-red'
          }`}
        >
          🔥 {ALL_TAB}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.name)}
            aria-pressed={selectedCategory === category.name}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              selectedCategory === category.name
                ? 'border-brand-red bg-brand-red text-white'
                : 'border-brand-dark/20 bg-white text-brand-dark hover:border-brand-red hover:text-brand-red'
            }`}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {filteredPromotions.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-brand-dark">No hay promociones en esta categoría.</p>
          <p className="text-sm text-gray-600">Probá con otra categoría.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPromotions.map((promo) => (
            <ProductCard key={promo.id} product={promo} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Promociones
