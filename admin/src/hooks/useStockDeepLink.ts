import { useCallback, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { PARAM_BUSQUEDA } from '../utils/navegacion/parametros'

export function useStockDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const busquedaCruda = searchParams.get(PARAM_BUSQUEDA)
  const nombreBuscado = busquedaCruda?.trim() || null
  const busquedaInvalida =
    searchParams.has(PARAM_BUSQUEDA) && nombreBuscado === null

  useEffect(() => {
    if (!busquedaInvalida) return

    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete(PARAM_BUSQUEDA)
    setSearchParams(siguientes, { replace: true })
  }, [busquedaInvalida, searchParams, setSearchParams])

  const limpiarBusqueda = useCallback(() => {
    if (!searchParams.has(PARAM_BUSQUEDA)) return

    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete(PARAM_BUSQUEDA)
    setSearchParams(siguientes, { replace: true })
  }, [searchParams, setSearchParams])

  return {
    nombreBuscado,
    claveNavegacion: location.key,
    limpiarBusqueda,
  }
}
