import { useEffect, useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import ProductCard from '../components/home/ProductCard'
import CategoryFilter from '../components/catalogo/CategoryFilter'
import PageHeader from '../components/ui/PageHeader'
import { getPromoCategories, getPromotions } from '../services/promotionService'
import type { Category, Product } from '../types/product'

// Ojo: las promos todavía vienen de mocks/promotions.ts (no hay tabla de promociones en el backend)
function Promociones() {
  const [promotions, setPromotions] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriaId, setCategoriaId] = useState<number | null>(null)

  useEffect(() => {
    getPromotions().then(setPromotions)
    getPromoCategories().then(setCategories)
  }, [])

  const filtradas = useMemo(() => {
    const nombre = categories.find((c) => c.id === categoriaId)?.nombre
    return promotions
      .filter((promo) => !nombre || promo.category === nombre)
      .sort((a, b) => Number(b.available) - Number(a.available))
  }, [promotions, categories, categoriaId])

  return (
    <div className="min-h-screen bg-brand-cream pb-16 text-brand-dark">
      <PageHeader
        titulo={
          <>
            Promos <span className="text-brand-red">que pegan</span>
          </>
        }
        subtitulo="Aprovechá nuestros combos y descuentos de la semana."
      />

      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-9">
          <CategoryFilter categorias={categories} seleccionada={categoriaId} onSeleccionar={setCategoriaId} />
        </div>

        {filtradas.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-mustard">
              <SearchX className="h-7 w-7" />
            </span>
            <p className="font-display text-2xl font-extrabold">No hay promos en esta categoría</p>
            <p className="text-brand-muted">Probá con otra.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtradas.map((promo) => (
              <ProductCard
                key={promo.id}
                product={{
                  id: promo.id,
                  nombre: promo.name,
                  descripcion: promo.description,
                  precio: promo.price,
                  imagen: promo.image,
                  disponible: promo.available,
                  categoriaId: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Promociones