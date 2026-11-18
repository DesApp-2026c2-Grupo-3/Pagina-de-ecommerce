import { useSyncExternalStore } from 'react'

import { hayModalAbierto, suscribirModales } from './useBloquearScroll'

// true mientras haya algún modal del panel abierto (D-23)
export function useHayModalAbierto() {
  return useSyncExternalStore(suscribirModales, hayModalAbierto)
}
