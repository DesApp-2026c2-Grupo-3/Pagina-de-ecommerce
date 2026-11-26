import { useCallback, useEffect, useRef, useState } from 'react'
import { obtenerMovimientos, obtenerStockPorSucursal } from '../../services/stockService'
import { obtenerSucursalPorId } from '../../services/sucursalService'
import type { ItemStock, Movimiento } from '../../types/stock.types'

// Stock y últimos movimientos de una sucursal (el backend devuelve los últimos 50).
// `onCargaInicial` recibe el stock de la primera carga (para la alerta al entrar, RN-11).
export function useStockSucursal(sucursalId: number, onCargaInicial?: (stock: ItemStock[]) => void) {
  const [sucursal, setSucursal] = useState<{ nombre: string } | null>(null)
  const [stock, setStock] = useState<ItemStock[]>([])
  const [stockCargadoPara, setStockCargadoPara] = useState<number | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const cargaInicialRef = useRef(onCargaInicial)
  useEffect(() => {
    cargaInicialRef.current = onCargaInicial
  }, [onCargaInicial])

  // Otra sucursal: se reinicia en el render (no en un efecto)
  const [sucursalMostrada, setSucursalMostrada] = useState(sucursalId)
  if (sucursalMostrada !== sucursalId) {
    setSucursalMostrada(sucursalId)
    setSucursal(null)
    setStock([])
    setStockCargadoPara(null)
    setMovimientos([])
    setCargando(true)
    setError('')
  }

  const recargar = useCallback(async (): Promise<ItemStock[]> => {
    const [datosStock, datosMovimientos] = await Promise.all([
      obtenerStockPorSucursal(sucursalId) as Promise<ItemStock[]>,
      obtenerMovimientos(sucursalId) as Promise<Movimiento[]>,
    ])
    setStock(datosStock)
    setStockCargadoPara(sucursalId)
    setMovimientos(datosMovimientos)
    setError('')
    return datosStock
  }, [sucursalId])

  useEffect(() => {
    let vigente = true
    obtenerSucursalPorId(sucursalId)
      .then((datos) => {
        if (vigente) setSucursal(datos)
      })
      .catch(() => {
        if (vigente) setSucursal(null)
      })
    recargar()
      .then((datos) => {
        if (vigente) cargaInicialRef.current?.(datos)
      })
      .catch((err) => {
        if (vigente) setError(err instanceof Error ? err.message : 'Error al cargar el stock')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [recargar, sucursalId])

  return { sucursal, stock, stockCargadoPara, movimientos, cargando, error, recargar }
}
