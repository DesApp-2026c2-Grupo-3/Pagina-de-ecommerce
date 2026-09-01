import CategorySection from './components/home/CategorySection'
import Hero from './components/home/Hero'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import { categories, products } from './mocks/products'

function App() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <Navbar />
      <main id="menu">
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
      </main>
      <Footer />
    </div>
  )
}

export default App
