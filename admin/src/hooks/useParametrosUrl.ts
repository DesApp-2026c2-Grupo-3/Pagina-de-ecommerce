import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// Cambia varios parámetros de la URL a la vez (null o vacío = quitarlo).
// Usa `replace` para no llenar el historial mientras se escribe. Lo comparten Pedidos y Viajes.
export function useParametrosUrl() {
  const [searchParams, setSearchParams] = useSearchParams()

  const actualizar = useCallback(
    (cambios: Record<string, string | null>) => {
      setSearchParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === null || valor === '') siguientes.delete(clave)
            else siguientes.set(clave, valor)
          }
          return siguientes
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { searchParams, actualizar }
}
