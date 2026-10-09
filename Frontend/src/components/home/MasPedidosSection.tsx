import { useEffect, useState } from 'react'
import { useZona } from '../../context/ZonaContext'
import { getMasPedidos, getProducts } from '../../services/productService'
import ProductCard from './ProductCard'
import type { ProductoBackend } from '../../types/product'

// "Los más pedidos": ranking real calculado por el backend, con la disponibilidad de la sucursal del cliente
function MasPedidosSection() {
  const { zona } = useZona()
  const sucursalId = zona?.sucursalId ?? null
  const [productos, setProductos] = useState<ProductoBackend[]>([])

  useEffect(() => {
    Promise.all([getMasPedidos(sucursalId), getProducts(sucursalId)])
      .then(([ranking, catalogo]) => {
        const porId = new Map(catalogo.map((p) => [p.id, p]))
        setProductos(
          ranking
            .map((r) => porId.get(r.productoId))
            .filter((p): p is ProductoBackend => Boolean(p?.disponible)),
        )
      })
      .catch(() => setProductos([]))
  }, [sucursalId])

  // Sin pedidos todavía (o sin stock de ninguno), la sección no aparece
  if (productos.length === 0) return null

  return (
    <section className="bg-brand-cream px-4 py-16 text-brand-dark">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 font-display text-4xl font-extrabold tracking-tight">
          Los más pedidos{zona ? <span className="text-brand-red"> en {zona.sucursalNombre}</span> : null}
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productos.map((producto, i) => (
            <div key={producto.id} className="relative">
              <span className="absolute right-3 top-3 z-10 grid h-10 w-10 rotate-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard font-display text-sm font-extrabold">
                #{i + 1}
              </span>
              <ProductCard product={producto} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MasPedidosSection