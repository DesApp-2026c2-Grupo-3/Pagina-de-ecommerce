import { useEffect, useState } from 'react'
import CategorySection from '../components/home/CategorySection'
import Hero from '../components/home/Hero'
import { getCategories, getProducts } from '../services/productService'
import type { Category, Product } from '../types/product'

function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getProducts().then(setProducts)
    getCategories().then(setCategories)
  }, [])

  return (
    <section id="menu">
      <Hero />
      {categories.map((category) => {
        const categoryProducts = products.filter(
          (product) => product.category === category.name && product.available,
        )
        if (categoryProducts.length === 0) return null
        return (
          <CategorySection
            key={category.id}
            categoryId={category.id}
            title={category.name}
            icon={category.icon}
            products={categoryProducts}
          />
        )
      })}
    </section>
  )
}

export default Home