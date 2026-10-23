import { useEffect, useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useZona } from '../../context/ZonaContext'
import { getCategories, getMasPedidos, getProducts } from '../../services/productService'
import { esCategoriaOculta } from '../../config/gruposCatalogo'
import ProductCard from '../home/ProductCard'
import type { ProductoBackend } from '../../types/product'

const MAXIMO = 4

// "¿Le sumás algo?": los más pedidos de la sucursal que todavía no están en el carrito (datos reales)
function SugerenciasCarrito() {
  const { items } = useCart()
  const { zona } = useZona()
  const sucursalId = zona?.sucursalId ?? null
  const [ranking, setRanking] = useState<ProductoBackend[]>([])

  useEffect(() => {
    Promise.all([getMasPedidos(sucursalId, 12), getProducts(sucursalId), getCategories()])
      .then(([masPedidos, catalogo, categorias]) => {
        const porId = new Map(catalogo.map((p) => [p.id, p]))
        // Las salsas ya se ofrecen aparte en el carrito
        const ocultas = new Set(categorias.filter((c) => esCategoriaOculta(c.nombre)).map((c) => c.id))
        setRanking(
          masPedidos
            .map((r) => porId.get(r.productoId))
            .filter((p): p is ProductoBackend => Boolean(p?.disponible) && !ocultas.has(p!.categoriaId)),
        )
      })
      .catch(() => setRanking([]))
  }, [sucursalId])

  const enCarrito = new Set(items.map((i) => i.product.id))
  const sugerencias = ranking.filter((p) => !enCarrito.has(p.id)).slice(0, MAXIMO)

  if (sugerencias.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight">
        ¿Le <span className="text-brand-red">sumás</span> algo?
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sugerencias.map((producto) => (
          <ProductCard key={producto.id} product={producto} />
        ))}
      </div>
    </section>
  )
}

export default SugerenciasCarrito