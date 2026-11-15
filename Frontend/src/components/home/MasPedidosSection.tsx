import { useEffect, useState } from 'react'
import { useZona } from '../../context/ZonaContext'
import { getMasPedidos, getProducts } from '../../services/productService'
import RankingProductosRow from './RankingProductosRow'
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
    <div className='mt-[-60px]'>
      <RankingProductosRow
      titulo="Los más pedidos en"
      lugar={<span className="text-brand-red">{zona ? zona.sucursalNombre : 'BurgerFast'}</span>}
      productos={productos}
      etiqueta="Los productos más pedidos"
      />
    </div>
    
  )
}

export default MasPedidosSection
