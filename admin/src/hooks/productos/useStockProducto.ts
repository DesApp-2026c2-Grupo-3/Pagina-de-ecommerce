import { useEffect, useState } from 'react'
import { verStockProducto } from '../../services/productoService'
import type { StockDeProducto } from '../../types/producto.types'

// Stock de un producto por sucursal, con el mismo servicio que usaba el modal
export function useStockProducto(productoId: number | null) {
  const [stock, setStock] = useState<StockDeProducto | null>(null)
  const [cargando, setCargando] = useState(productoId !== null)
  const [error, setError] = useState(productoId === null ? 'El producto solicitado no es válido.' : '')

  useEffect(() => {
    if (productoId === null) return
    let vigente = true
    ;(verStockProducto(productoId) as Promise<StockDeProducto>)
      .then((datos) => {
        if (vigente) setStock(datos)
      })
      .catch((err) => {
        if (vigente) setError(err instanceof Error ? err.message : 'No se pudo cargar el stock')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [productoId])

  return { stock, cargando, error }
}
