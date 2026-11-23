import { useEffect, useState } from 'react'
import { useZona } from '../../context/ZonaContext'
import { getMasPedidos, getProducts } from '../../services/productService'
import RankingProductosRow from './RankingProductosRow'
import type { ProductoBackend } from '../../types/product'

const STYLES = {
  wrapper: 'mt-[-60px]',
  sucursalHighlight: 'text-brand-red',
} as const

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

  if (productos.length === 0) return null

  return (
    <div className={STYLES.wrapper}>
      <RankingProductosRow
        titulo="Los más pedidos en"
        lugar={<span className={STYLES.sucursalHighlight}>{zona ? zona.sucursalNombre : 'BurgerFast'}</span>}
        productos={productos}
        etiqueta="Los productos más pedidos"
      />
    </div>
  )
}

export default MasPedidosSection
