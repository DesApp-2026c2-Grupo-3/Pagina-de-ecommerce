import CategorySection from '../components/home/CategorySection'
import Hero from '../components/home/Hero'
import { categories, products } from '../mocks/products'

function Home() {
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
