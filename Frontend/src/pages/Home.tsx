import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from '../components/home/Hero'
import CategorySection from '../components/home/CategorySection'
import CategoryChips from '../components/home/CategoryChips'
import DefaultBranchBadge from '../components/home/DefaultBranchBadge'
import GuestQuickAccessRow from '../components/home/GuestQuickAccessRow'
import CompanySection from '../components/home/CompanySection'
import ContactSection from '../components/home/ContactSection'
import CareersSection from '../components/home/CareersSection'
import { getCategories, getProducts } from '../services/productService'
import { useAuth } from '../context/AuthContext'
import type { Category, Product } from '../types/product'

function Home() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getProducts(), getCategories()])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes)
        setCategories(categoriesRes)
      })
      .finally(() => setLoading(false))
  }, [])

  // Hace scroll hasta la sección correspondiente cuando el navbar linkea
  // con un hash, por ejemplo "/#sobre-nosotros" o "/#trabaja-con-nosotros".
  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    target?.scrollIntoView({ behavior: 'smooth' })
  }, [location])

  const categorySections = useMemo(() => {
    return categories
      .map((category) => ({
        category,
      products: products
        .filter((product) => product.category === category.name)
        .sort((a, b) => Number(b.available) - Number(a.available)),  
      }))
      .filter((entry) => entry.products.length > 0)
  }, [categories, products])

  return (
    <div id="menu">
      <Hero />

      {isAuthenticated ? (
        <>
          <DefaultBranchBadge />

          {!loading && categorySections.length > 0 && (
            <CategoryChips categories={categorySections.map((entry) => entry.category)} />
          )}

          {loading ? (
            <p className="px-4 py-12 text-center text-gray-600">Cargando productos...</p>
          ) : (
            categorySections.map(({ category, products: categoryProducts }) => (
              <CategorySection
                key={category.id}
                categoryId={category.id}
                title={category.name}
                icon={category.icon}
                products={categoryProducts}
              />
            ))
          )}
        </>
      ) : (
        <>
          <GuestQuickAccessRow />
          <CompanySection />
          <ContactSection />
          <CareersSection />
        </>
      )}
    </div>
  )
}

export default Home
