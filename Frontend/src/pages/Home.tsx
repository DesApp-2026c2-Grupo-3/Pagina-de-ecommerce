import { useEffect, useState } from 'react'
import Hero from '../components/home/Hero'
import ProductCard from '../components/home/ProductCard'
import { getProducts } from '../services/productService'
import type { Product } from '../types/product'

function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="menu">
      <Hero />

      {loading ? (
        <p className="px-4 py-12 text-center text-gray-600">Cargando productos...</p>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
          {products
            .filter((p) => p.available)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </section>
  )
}

export default Home