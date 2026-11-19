import { useCallback, useSyncExternalStore } from 'react'

// true mientras la pantalla cumpla la consulta (por ejemplo, CONSULTA_CELULAR).
// Se actualiza sola cuando cambia el ancho: no hace falta medir a mano.
export function useMediaQuery(consulta: string): boolean {
  const suscribir = useCallback(
    (avisar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    [consulta],
  )

  return useSyncExternalStore(suscribir, () => window.matchMedia(consulta).matches)
}
