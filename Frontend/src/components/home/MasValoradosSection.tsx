import { useEffect, useState } from 'react'
import { useZona } from '../../context/ZonaContext'
import { getMasValorados, getProducts } from '../../services/productService'
import RankingProductosRow from './RankingProductosRow'
import type { ProductoBackend } from '../../types/product'

const CANTIDAD = 4

// "Los más valorados": ranking por estrellas de los clientes. Con una sucursal elegida cuenta solo las calificaciones de esa sucursal.
function MasValoradosSection() {
  const { zona } = useZona()
  const sucursalId = zona?.sucursalId ?? null
  const [productos, setProductos] = useState<ProductoBackend[]>([])

  useEffect(() => {
    // Se piden de más: los que no están disponibles en la sucursal se saltean y igual se completa el row
    Promise.all([getMasValorados(sucursalId), getProducts(sucursalId)])
      .then(([ranking, catalogo]) => {
        const porId = new Map(catalogo.map((p) => [p.id, p]))
        setProductos(
          ranking
            .map((r) => porId.get(r.productoId))
            .filter((p): p is ProductoBackend => Boolean(p?.disponible))
            .slice(0, CANTIDAD),
        )
      })
      .catch(() => setProductos([]))
  }, [sucursalId])

  // Sin calificaciones todavía (o sin stock de ninguno), la sección no aparece
  if (productos.length === 0) return null

  return (
    <RankingProductosRow
      titulo="Los más valorados en"
      lugar={<span className="text-brand-red">{zona ? zona.sucursalNombre : 'BurgerFast'}</span>}
      productos={productos}
      // Va pegada a "Los más pedidos": sin el espacio de arriba para no duplicar el aire entre las dos
      claseSeccion="pb-12 sm:pb-16"
      etiqueta="Los productos más valorados"
    />
  )
}

export default MasValoradosSection
