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
    // El ranking ya viene sin los complementos (salsas): lo arma el backend
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
    <section className="bg-brand-cream px-4 py-12 text-brand-dark sm:py-16">
  <div className="mx-auto max-w-7xl">
    <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight sm:mb-8 sm:text-4xl">
      Los más pedidos en {zona ? <span className="text-brand-red"> {zona.sucursalNombre}</span> : <span className="text-brand-red">BurgerFast</span>}
    </h2>

    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {productos.map((producto, i) => (
        <div key={producto.id} className="relative">
         <span className="absolute left-2 top-2 z-10 grid h-8 w-8 -rotate-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-dark font-display text-xs font-extrabold text-white sm:left-3 sm:top-3 sm:h-10 sm:w-10 sm:text-sm">
  #{i + 1}
</span>

          
          {/* 
            🛠️ ACOPLE DEFINITIVO:
            Inyectamos mostrarDescripcion={false} para limpiar el cuerpo de la tarjeta,
            dejando que la grilla de dos columnas luzca súper simétrica y simétrica en móviles.
          */}
          <ProductCard 
            product={producto} 
            indice={i} 
            compacta={false} 
            mostrarDescripcion={false} 
          />
        </div>
      ))}
    </div>
  </div>
</section>

  )
}

export default MasPedidosSection
