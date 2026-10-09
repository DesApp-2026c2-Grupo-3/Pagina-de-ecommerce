import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../services/productService'
import { estiloCategoria } from '../../config/categorias'
import CategoryIcon from '../icons/CategoryIcon'
import type { Category } from '../../types/product'

// "Elegí por antojo": acceso directo al catálogo filtrado por categoría
function CategoriasRow() {
  const [categorias, setCategorias] = useState<Category[]>([])

  useEffect(() => {
    getCategories()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  if (categorias.length === 0) return null

  return (
    <section className="bg-brand-cream px-4 py-12 text-brand-dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Elegí por antojo</h2>
          <Link to="/catalogo" className="font-bold text-brand-red hover:underline">
            Ver todo el menú →
          </Link>
        </div>

        <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:gap-4 md:overflow-visible md:px-0">
          {categorias.map((categoria) => {
            const { icono, fondo } = estiloCategoria(categoria.nombre)
            return (
              <Link
                key={categoria.id}
                to={`/catalogo?categoria=${categoria.id}`}
                className="flex w-28 shrink-0 flex-col items-center gap-3 rounded-3xl border-2 border-brand-dark bg-white px-2 pb-4 pt-5 text-center text-sm font-bold transition-transform hover:-translate-y-1 md:w-auto"
              >
                <span className={`grid h-16 w-16 place-items-center rounded-2xl ${fondo}`}>
                  <CategoryIcon icono={icono} />
                </span>
                {categoria.nombre}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CategoriasRow