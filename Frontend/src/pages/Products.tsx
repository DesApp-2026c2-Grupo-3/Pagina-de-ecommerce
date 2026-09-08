import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/home/ProductCard'
import { getCategories, getProducts } from '../services/productService'
import type { Category, Product } from '../types/product'

const ALL_TAB = 'Todos'

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_TAB)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getProducts().then(setProducts)
    getCategories().then(setCategories)
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      if (!product.available) return false
      if (selectedCategory !== ALL_TAB && product.category !== selectedCategory) return false
      if (query && !product.name.toLowerCase().includes(query)) return false
      return true
    })
  }, [products, selectedCategory, search])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-brand-dark sm:text-4xl">Nuestro Menú</h1>
      <p className="mt-2 text-gray-600">Elegí una categoría o buscá tu producto favorito.</p>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0 md:pb-0">
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
            🍽️ {ALL_TAB}
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

        <div className="relative w-full md:w-72">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            className="w-full rounded-full border border-brand-dark/20 bg-white py-2 pl-10 pr-4 text-brand-dark placeholder:text-gray-400 focus:border-brand-red focus:outline-none"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-brand-dark">No encontramos productos con ese criterio.</p>
          <p className="text-sm text-gray-600">Probá con otra categoría o cambiá la búsqueda.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Products
