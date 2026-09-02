import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { products } from '../mocks/products'

function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const product = products.find((item) => item.id === Number(id))
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleOption(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!product) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">Producto no encontrado</h1>
        <p className="text-gray-600">El producto que buscás no existe o ya no está disponible.</p>
        <Link
          to="/"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Volver al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link to="/" className="inline-block font-semibold text-brand-red hover:underline">
        ← Volver al catálogo
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <img
          src={product.image}
          alt={product.name}
          className="h-72 w-full rounded-2xl bg-brand-cream object-cover md:h-96"
        />

        <div className="flex flex-col">
          <span className="inline-block w-fit rounded-full bg-brand-red/10 px-3 py-1 text-sm font-bold text-brand-red">
            {product.category}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-brand-dark sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-gray-600">{product.description}</p>

          {product.configurations && product.configurations.length > 0 && (
            <div className="mt-6 space-y-4">
              {product.configurations.map((config) => (
                <div key={config.label}>
                  <p className="font-bold text-brand-dark">{config.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {config.options.map((option) => {
                      const key = `${config.label}-${option}`
                      const isSelected = selected.has(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleOption(key)}
                          className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                            isSelected
                              ? 'border-brand-red bg-brand-red text-white'
                              : 'border-brand-dark/20 bg-white text-brand-dark hover:border-brand-red hover:text-brand-red'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <span className="text-3xl font-extrabold text-brand-red">
              ${product.price.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
            >
              Agregar al carrito
            </button>
            <button
              type="button"
              className="rounded-full bg-brand-dark px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
            >
              Comprar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
